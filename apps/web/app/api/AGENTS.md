# 后端

业务日志用 `createLogger`，Route Handler 用 `withAxiomBodyLog` / `withAxiom` 包裹导出。`console.log` 仅限临时调试，不要作为正式日志手段。详见 `src/shared/lib/infrastructure/axiom/AGENTS.md`。
