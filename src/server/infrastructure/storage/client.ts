import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { S3_CONFIG } from "./constants";
import type { BucketVisibility, DeleteParams, ImageOptions, UploadParams } from "./types";
import { base64ToBlob, isBase64, isUrl, parseKeyFromPublicUrl, urlToBlob } from "./utils";

// # S3 存储客户端：封装上传、删除等对象存储操作（兼容 AWS S3 / R2 / MinIO）

let s3StorageClient: S3StorageClient | undefined;

// S3 存储客户端，封装上传等对象存储操作
export class S3StorageClient {
	private readonly s3Client: S3Client;
	private readonly publicBucket: string;
	private readonly privateBucket: string;
	private readonly publicUrl: string;

	constructor() {
		const { accessKeyId, secretAccessKey, publicBucket, publicUrl } = S3_CONFIG;

		if (!accessKeyId || !secretAccessKey || !publicBucket || !publicUrl) {
			throw new Error("S3 配置缺失，请检查 S3 相关环境变量。");
		}

		this.s3Client = new S3Client({
			region: S3_CONFIG.region,
			...(S3_CONFIG.endpoint ? { endpoint: S3_CONFIG.endpoint } : {}),
			credentials: { accessKeyId, secretAccessKey },
			forcePathStyle: true,
		});
		this.publicBucket = publicBucket;
		this.privateBucket = S3_CONFIG.privateBucket ?? "";
		this.publicUrl = publicUrl;
	}

	// 上传文件到 S3 存储桶并返回公开访问 URL
	async upload({ key, body, options, visibility = "public" }: UploadParams): Promise<string> {
		const targetBucket = this._resolveBucket(visibility);
		const resolvedBody = await this._resolveBody(body, options);

		// > AWS SDK 对 Buffer 支持最稳定；Node + undici 的 Blob 内部 stream 已流动，
		// > 直接传给 SDK 会导致 checksum 计算失败（"Unable to calculate hash for flowing readable stream"）
		const uploadBody =
			resolvedBody instanceof Blob ? Buffer.from(await resolvedBody.arrayBuffer()) : resolvedBody;

		const command = new PutObjectCommand({
			Bucket: targetBucket,
			Key: key,
			Body: uploadBody,
			ContentType:
				options?.contentType ?? (resolvedBody instanceof Blob ? resolvedBody.type : undefined),
		});

		await this.s3Client.send(command);
		return this._buildPublicUrl(key);
	}

	// 删除 S3 存储桶中的对象（幂等：key 不存在不会报错）
	async delete({ key, visibility = "public" }: DeleteParams): Promise<void> {
		const targetBucket = this._resolveBucket(visibility);
		const command = new DeleteObjectCommand({ Bucket: targetBucket, Key: key });
		await this.s3Client.send(command);
	}

	// 从公开访问 URL 反解对象 key；非自有桶 URL 返回 null（不会抛错）
	parseKeyFromUrl(url: string): string | null {
		return parseKeyFromPublicUrl(url, this.publicUrl);
	}

	// 将上传内容统一解析为可发送的二进制数据
	private async _resolveBody(
		body: string | Blob | Buffer,
		options?: ImageOptions,
	): Promise<Blob | Buffer> {
		if (typeof body === "string") {
			if (isBase64(body)) {
				return base64ToBlob(body, { contentType: options?.contentType });
			}
			if (isUrl(body)) {
				return urlToBlob(body);
			}
			throw new Error("字符串内容既不是 Base64 编码也不是有效 URL，无法处理。");
		}

		return body;
	}

	// 根据可见性获取对应的存储桶名称
	private _resolveBucket(visibility: BucketVisibility): string {
		return visibility === "private" ? this.privateBucket : this.publicBucket;
	}

	// 构造文件上传后的公开访问 URL
	private _buildPublicUrl(key: string): string {
		const base = this.publicUrl.replace(/\/$/, "");
		return `${base}/${key}`;
	}
}

// 获取 S3 存储客户端单例（懒加载，首次调用时初始化）
export const getS3StorageClient = (): S3StorageClient => {
	if (!s3StorageClient) {
		s3StorageClient = new S3StorageClient();
	}
	return s3StorageClient;
};
