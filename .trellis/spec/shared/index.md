# 通用规范（shared）

> 适用于前后端所有代码的通用规则。编写任何代码前先读本目录。

## 文档索引

| 文件 | 内容 | 何时读 |
| --- | --- | --- |
| [typescript.md](./typescript.md) | TypeScript 与类型规则（zod-first、Dto/Vo、禁 `any`/`!`/`@ts-ignore`） | 写任何带类型的代码 |
| [code-quality.md](./code-quality.md) | 代码质量硬规则、命名、控制流、注释层次、Options Object | 始终 |
| [dependencies.md](./dependencies.md) | 真实技术栈与依赖版本 | 选型、加依赖 |

## 核心硬规则

| 规则 | 出处 |
| --- | --- |
| 禁 `any`、禁非空断言 `!`、禁 `@ts-ignore`/`@ts-expect-error` | code-quality.md |
| 类型从 Zod schema 派生，不手写重复类型 | typescript.md |
| 入参 Dto / 出参 Vo，严格分层 | typescript.md |
| `import type` 用于类型专用导入 | typescript.md |
| 命令用项目脚本：`pnpm run typecheck` / `pnpm run lint` | code-quality.md |

## 提交前检查

- [ ] `pnpm run typecheck` 无错误
- [ ] `pnpm run lint` 无错误
- [ ] 新代码无 `any` / `!` / `@ts-ignore`
- [ ] 接口类型从 Dto/Vo schema 派生，未手写重复

> 项目权威规范源在各目录的 `AGENTS.md`（根、`app/`、`app/api/`、`src/`、`prisma/`、`src/shared/lib/zod/` 等）。本 spec 是其结构化镜像，供 Trellis 子代理自动加载；冲突时以 AGENTS.md 为准。
