// S3 存储配置（通过环境变量注入，兼容 AWS S3 / R2 / MinIO 等）
export const S3_CONFIG = {
  endpoint: process.env.S3_ENDPOINT, // 自定义服务地址（R2 / MinIO 必填，AWS S3 留空）
  region: process.env.S3_REGION ?? "auto", // 数据中心区域，默认 auto
  accessKeyId: process.env.S3_ACCESS_KEY_ID, // 访问密钥 ID
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY, // 访问密钥
  publicBucket: process.env.S3_PUBLIC_BUCKET, // 公开存储桶名
  privateBucket: process.env.S3_PRIVATE_BUCKET, // 私有存储桶名
  publicUrl: process.env.S3_PUBLIC_URL, // 公开访问基址，用于拼接文件 URL
} as const;
