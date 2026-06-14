// 存储桶可见性类型
export type BucketVisibility = "public" | "private";

// 图片上传选项接口
export interface ImageOptions {
  contentType?: string;
  width?: number;
  height?: number;
  headers?: Record<string, string>;
}
