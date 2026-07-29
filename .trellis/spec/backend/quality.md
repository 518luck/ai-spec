# 后端提交前清单

提交后端代码前逐项核对。

## 类型与质量

- [ ] `pnpm run typecheck` 无错误（不直接跑 tsc）
- [ ] `pnpm run lint` 无错误
- [ ] 无 `any` / `!` / `@ts-ignore` / `@ts-expect-error`
- [ ] 入参 Dto / 出参 Vo，均经 Zod 校验
- [ ] 接口类型从 schema 派生，未手写重复

## Route Handler / Server Action

- [ ] Route Handler 用 `withPersonal`/`withSession` 包裹（含日志 + 鉴权 + 错误归一）
- [ ] 需登录的 Server Action 用 `authUserActionClient`，无需登录用 `actionClient`
- [ ] 业务错误抛 `AiSpecError`，**未**在 handler 手写 `NextResponse.json({ error })`
- [ ] 出参经 Vo 校验，未返回 Prisma 裸对象

## 数据库

- [ ] `src/shared/db/generator/` 未被手改
- [ ] 无循环内 `await` 查询（N+1）；批量写用 `createMany`/`updateMany`
- [ ] schema 字段 camelCase + `@map`，字段排列分区正确，每个字段有行内注释
- [ ] 新 model 带 `@@schema("域")`

## 日志 / 异步

- [ ] 正式日志用 `createLogger(module)`，未用 `console.log`
- [ ] 日志上下文是结构化对象，未字符串拼接
- [ ] 未记录敏感信息（token / 密钥 / PII 原文）
- [ ] 业务后台任务走 BullMQ，未用 `next/after` 跑业务任务

## 运行环境

- [ ] 服务端依赖模块未被客户端组件直接导入
- [ ] 新增第三方服务接入放 `src/shared/lib/infrastructure/<服务>/`
- [ ] RBAC 改动同步检查 `actions.ts` 与 `scopes.ts`
