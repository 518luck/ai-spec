// 存储桶可见性类型
export type BucketVisibility = "public" | "private";

// 图片上传选项接口
export interface ImageOptions {
  contentType?: string;
  width?: number;
  height?: number;
  headers?: Record<string, string>;
}

// upload 方法的参数对象
export interface UploadParams {
  key: string;
  body: string | Blob | Buffer;
  options?: ImageOptions;
  visibility?: BucketVisibility;
}

// delete 方法的参数对象
export interface DeleteParams {
  key: string;
  visibility?: BucketVisibility;
}
