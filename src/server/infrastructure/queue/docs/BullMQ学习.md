```ts
new Queue("avatar-sync", {
  // ───────────────────────
  // 1. 连接配置（必填）
  // ───────────────────────
  connection: getAppRedis(), // Queue 是生产者，用应用侧 fail-fast 连接（Worker 才用 getWorkerRedis）
  // 类型: Redis 实例 | { host, port, password, db, url }
  // IORedis 连接实例或连接参数对象

  // ───────────────────────
  // 2. 默认任务配置
  // ───────────────────────
  defaultJobOptions: {
    // 重试次数：失败后最多重试几次，0 表示不重试
    attempts: 3,

    // 退避策略：失败后等多久再重试
    backoff: {
      type: "exponential", // "exponential"（指数递增）| "fixed"（固定间隔）
      delay: 5000, // 首次重试延迟（毫秒），exponential 下每次翻倍
    },

    // 任务完成后自动删除（防止 Redis 数据无限增长）
    removeOnComplete: {
      age: 3600, // 1 小时后自动删除（秒）
      count: 100, // 或只保留最近 100 条
    },
    // 简写形式：
    // removeOnComplete: true,   // 完成后立即删除
    // removeOnComplete: 100,    // 只保留最近 100 条

    // 任务失败后自动删除
    removeOnFail: {
      age: 86400, // 24 小时后自动删除（秒）
      count: 500, // 或只保留最近 500 条
    },

    // 优先级：数字越小越优先被 Worker 取出执行
    priority: 1,

    // 延迟执行：任务入队后延迟多少毫秒才可被消费
    delay: 0,

    // 任务唯一标识，防止重复添加相同任务
    jobId: "unique-key",

    // 是否覆盖已存在的重复任务
    // 需要配合 jobId 使用
    removeOnFailOnOverride: false,
  },

  // ───────────────────────
  // 3. Redis key 前缀
  // ───────────────────────
  prefix: "bull",
  // 默认 "bull"，Redis 中的 key 会变成 bull:avatar-sync:xxx
  // 多项目共用同一 Redis 时修改前缀避免冲突

  // ───────────────────────
  // 4. 遥测/监控（BullMQ 5.x 新增）
  // ───────────────────────
  telemetry: {
    metadata: {
      service: "ai-spec", // 自定义元数据，用于追踪
    },
  },
});
```

```
```
