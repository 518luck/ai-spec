# 后端

## 日志

- Route Handler 用 `withAxiomBodyLog` / `withAxiom` 包裹导出
- 业务代码用 `createLogger(module)`
- `console.log` 仅限临时调试，不作正式日志手段

详见 `src/server/infrastructure/axiom/AGENTS.md`。

## 参数校验

- **入参**（GET searchParams、POST/PUT/PATCH body）用 Dto schema
- **出参**（响应体）用 Vo schema
- 均经 Zod 校验后再使用或返回，不要直接解构裸数据

详见 `src/shared/lib/zod/AGENTS.md`。
