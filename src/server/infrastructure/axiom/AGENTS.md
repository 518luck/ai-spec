# 统一日志（Axiom）

正式日志不要用 `console.log`（临时调试可用）。Route Handler 用 `withAxiomBodyLog` / `withAxiom` 包裹导出，业务代码用 `createLogger(module)`。

```ts
import {
  createLogger,
  withAxiomBodyLog,
} from "@/server/infrastructure/axiom/server";

// 业务日志
const log = createLogger("UserService");
log.info("用户登录成功", { userId: "123" });

// Route Handler
export const POST = withAxiomBodyLog(handler);
```

## 本地日志文件（开发环境）

`createLogger` 在开发环境（`NODE_ENV !== "production"`）除推 Axiom 外，会额外把每条日志写入项目根 `logs/server.log`，格式为单行可读文本：

```
2026-07-01 16:51:13.212 ERROR [server-action] column "hashed_key" does not exist {"stack":"...","name":"PrismaClientKnownRequestError"}
```

- 仅开发环境落盘，生产环境不写本地文件（避免敏感信息泄露与文件无限增长）。
- `logs/` 已加入 `.gitignore`，不会提交。
- 排查问题时，直接翻 `logs/server.log` 或提供给 AI 协助分析。
