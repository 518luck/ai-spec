// # Worker 进程全局补齐：Next.js 运行时会注入 AsyncLocalStorage 全局，worker 与 Next 共享服务端代码（axiom 日志链依赖它），独立进程需自行提供
// ! 必须在 worker.ts 里先于业务模块导入——ESM import 按声明顺序执行，靠模块副作用保证全局先就位
import { AsyncLocalStorage } from "node:async_hooks";

Object.assign(globalThis, { AsyncLocalStorage });
