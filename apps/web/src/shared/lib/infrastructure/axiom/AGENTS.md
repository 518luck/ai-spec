# 统一日志（Axiom）

正式日志不要用 `console.log`（临时调试可用）。Route Handler 用 `withAxiomBodyLog` / `withAxiom` 包裹导出，业务代码用 `createLogger(module)`。

```ts
import {
  createLogger,
  withAxiomBodyLog,
} from "@/shared/lib/infrastructure/axiom/server";

// 业务日志
const log = createLogger("UserService");
log.info("用户登录成功", { userId: "123" });

// Route Handler
export const POST = withAxiomBodyLog(handler);
```
