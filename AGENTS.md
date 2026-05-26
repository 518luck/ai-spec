# AI 代理开发指南

## 概述

这个并不是你所熟悉的Next.js项目,前端的业务代码都在src下面,后端的代码都在app/api下面

## 项目结构

```

├── app/                   # Next.js App Router 路由层（薄层，仅路由定义，实现委托给 src/）
│   ├── api/               # 后端入口（API 端点及服务端处理逻辑均在此）
│   └── spec/
├── src/                   # 前端代码（shared/ 同时存放后端基础设施）
│   ├── app/               # 让应用运行起来的一切 — 路由、入口点、全局样式、提供者（providers）。
│   ├── pages/             # 完整页面或嵌套路由中的大块页面内容。
│   ├── widgets/           # 大型独立的功能或 UI 块，通常承载一个完整的用例。
│   ├── shared/            # 可复用的通用功能，特别是在与项目/业务的具体内容解耦时
│   ├── entities/          # 项目所涉及的业务实体，如 user 或 product。
│   └── features/          # 整个产品功能的可复用实现，即能为用户带来业务价值的操作。
├── prisma/                # ORM schema + migrations
└── public/                # 静态资源
```

## 数据库约束

操作数据库时必须遵循以下流程：

1. 在 `prisma/schema/schema.prisma` 中定义或修改 Model
2. 执行 `pnpm run prisma:generate` 生成 Prisma Client 代码
3. 如需同步数据库结构，执行 `pnpm run prisma:migrate`

**禁止手动修改** `src/shared/db/generator/` 下的任何文件，该目录由脚本自动生成。

### 命令

| 命令 | 说明 |
|---|---|
| `pnpm run prisma:validate` | 验证 schema 语法 |
| `pnpm run prisma:generate` | 生成 Prisma Client 代码 |
| `pnpm run prisma:migrate` | 创建并应用数据库迁移（开发环境） |

## 上下文感知加载 

根据你正在工作的区域使用对应的 AGENTS.md：

- **后端**（`app/api/**`）→ `app/api/AGENTS.md`（后端模式）
- **前后端通用**（`src/shared/**`）→ 注意，此目录下的代码前后端均在使用
- **前端**（`src/**`）→ `src/AGENTS.md`（前端模式）
- **通用** → 本文件（`AGENTS.md`）用于 ai-spec 概览和命令

### 后端

后端开发模式、安全指南和架构说明，参见 `app/api/AGENTS.md`。

### 前端

前端开发模式、设计系统指南和 React 测试最佳实践，参见 `src/AGENTS.md`。
