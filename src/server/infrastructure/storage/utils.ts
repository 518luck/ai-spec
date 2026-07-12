import type { ImageOptions } from "./types";

// # 存储工具函数：Base64 / URL 检测、Blob 转换、key 反解

// 检测字符串是否为 Base64 编码（兼容 data URI 和纯 Base64）
export const isBase64 = (value: string): boolean => {
	if (value.startsWith("data:") && value.includes(";base64,")) {
		return true;
	}

	const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
	return value.length > 0 && value.length % 4 === 0 && base64Regex.test(value);
};

// 检测字符串是否为 HTTP(S) URL
export const isUrl = (value: string): boolean => {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};

// 将 Base64 字符串转换为 Blob
export const base64ToBlob = (base64: string, options?: Pick<ImageOptions, "contentType">): Blob => {
	const data = base64.replace(/^data:.+;base64,/, "");
	const buffer = Buffer.from(data, "base64");
	return new Blob([buffer], options?.contentType ? { type: options.contentType } : {});
};

// 下载 URL 资源并转为 Blob
export const urlToBlob = async (url: string): Promise<Blob> => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`下载远程资源失败：${response.status} ${response.statusText}`);
	}
	return response.blob();
};

// 从公开访问 URL 反解对象 key；不属于该 publicUrl 基址时返回 null
export const parseKeyFromPublicUrl = (url: string, publicUrl: string): string | null => {
	const base = publicUrl.replace(/\/$/, "");
	const prefix = `${base}/`;
	if (!url.startsWith(prefix)) {
		return null;
	}
	return url.slice(prefix.length);
};
