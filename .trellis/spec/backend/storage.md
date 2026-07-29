# 对象存储（S3）

> 权威源：`src/server/infrastructure/storage/AGENTS.md`。

## 获取客户端

业务代码通过 `getS3StorageClient()` 获取 S3 客户端，**禁止直接 `new S3StorageClient()`**。

```ts
import { getS3StorageClient } from "@/server/infrastructure/storage";

const client = getS3StorageClient();
await client.putObject({ /* ... */ });
```

底层基于 `@aws-sdk/client-s3`。新增存储相关逻辑放在 `src/server/infrastructure/storage/`，业务代码只调用该目录暴露的适配函数，不散落 SDK 初始化。
