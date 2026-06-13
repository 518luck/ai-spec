# BullMQ 消息队列

本目录提供基于 BullMQ 的异步任务队列能力，底层依赖 Redis。

## 连接

BullMQ 专用 Redis 连接定义在 `redis/clients.ts`（`getBullMQRedis()`），要求 `maxRetriesPerRequest: null`。
不能复用限流连接，详见 `redis/AGENTS.md`。

## 目录结构

```
queue/
├── constants.ts      # 队列名、默认 Job 配置
├── types.ts          # Job 数据类型
├── queues.ts         # Queue 生产者实例（从 redis/queue-client 导入连接）
├── index.ts          # 公共 API（enqueue 助手）
└── processors/       # 具体任务处理器
    └── sync-oauth-avatar.ts
```

## 使用方式

### 生产者（Web 端）

业务代码只导入 `index.ts` 的公共 API，不直接操作 Queue：

```ts
import { enqueueAvatarSync } from "@/shared/lib/infrastructure/queue";

await enqueueAvatarSync({ userId: "xxx", imageUrl: "https://..." });
```

### 消费者（Worker 端）

Worker 进程入口在项目根目录 `worker.ts`，通过 `pnpm worker` 启动。

### 新增任务类型

1. `constants.ts` 添加队列名
2. `types.ts` 添加 Job 数据类型
3. `queues.ts` 添加 Queue 实例
4. `processors/` 添加处理器文件
5. `index.ts` 导出 enqueue 助手函数
6. `worker.ts` 注册 Worker

## 注意事项

- Worker 是长驻进程，不能运行在 Next.js serverless 内。
- 开发时需要同时运行 `pnpm dev` 和 `pnpm worker`。
- BullMQ Redis key 以 `bull:` 为前缀，不要与限流 key 冲突。
