# S3 对象存储

本目录封装 S3 兼容的对象存储能力（AWS S3 / Cloudflare R2 / MinIO 等），统一通过环境变量配置连接参数。

## 目录结构

```
storage/
├── constants.ts     # S3 配置常量（从环境变量读取）
├── types.ts         # ImageOptions 上传选项接口
├── utils.ts         # 字符串类型检测 + Base64/URL 转 Blob 工具函数
├── client.ts        # S3StorageClient 类 + 单例获取函数
├── index.ts         # 公共 API 导出
└── AGENTS.md
```

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `S3_ENDPOINT` | 否 | 自定义 endpoint（R2 / MinIO 必填；AWS S3 留空） |
| `S3_REGION` | 否 | 区域，默认 `auto` |
| `S3_ACCESS_KEY_ID` | 是 | 访问密钥 ID |
| `S3_SECRET_ACCESS_KEY` | 是 | 访问密钥 |
| `S3_PUBLIC_BUCKET` | 是 | 默认公开存储桶名 |
| `S3_PUBLIC_URL` | 是 | 公开访问基址，用于拼接文件 URL |

## 使用方式

```ts
import { getS3StorageClient } from "@/shared/lib/infrastructure/storage";

const client = getS3StorageClient();

// 上传 Blob / Buffer
const url = await client.upload("avatars/123.png", blob, {
  contentType: "image/png",
});

// 上传 Base64 字符串（自动检测并转换，待 base64ToBlob 实现后生效）
const url2 = await client.upload("photos/abc.jpg", base64String, {
  contentType: "image/jpeg",
});

// 上传远程 URL 资源（自动检测并下载转换，待 urlToBlob 实现后生效）
const url3 = await client.upload("thumbnails/xyz.png", imageUrl);

// 指定其他存储桶
const url4 = await client.upload("data/file.bin", buffer, undefined, "private-bucket");
```

## body 类型处理

`upload()` 的 `body` 参数接受 `string | Blob | Buffer`：

1. 若为 `string`，依次检测：
   - Base64 编码（含 `data:` URI）→ 调用 `base64ToBlob` 转换
   - HTTP(S) URL → 调用 `urlToBlob` 下载并转换
   - 都不匹配 → 抛出错误
2. 若为 `Blob` 或 `Buffer` → 直接上传

> **注意：** `base64ToBlob` 和 `urlToBlob` 目前为占位实现，调用时会抛出错误。

## 注意事项

- 所有文件均为服务端专用（顶部 `"server-only"`），不可被客户端组件导入。
- 业务代码通过 `getS3StorageClient()` 获取单例，不要直接 `new S3StorageClient()`。
- `base64ToBlob` 和 `urlToBlob` 实现后需移除 `throw` 占位。
