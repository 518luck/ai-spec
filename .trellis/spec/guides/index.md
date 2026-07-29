# 思维指南

> 目的：在写代码前问对问题，把"没想到"变成"已考虑"。核心理念：30 分钟思考省 3 小时调试。

## 指南

| 指南 | 目的 | 何时用 |
| --- | --- | --- |
| [实现前清单](./pre-implementation-checklist.md) | 写代码前核对就绪度 | 开始任何功能实现前 |
| [跨层思维指南](./cross-layer-thinking-guide.md) | 串通数据流经各层 | 功能跨 3+ 层时 |

## 本项目分层

```
Server Component (RSC，数据获取、静态渲染)
        ↓
Client Component ('use client'，交互、SWR)
        ↓
Route Handler / Server Action (校验、业务逻辑)
        ↓
业务逻辑 (Prisma 查询、领域规则)
        ↓
数据库层 (Prisma ORM、PostgreSQL、多 schema)
```

每个边界都是潜在 bug 源：

- **序列化**：跨 RSC/Client 边界只传可序列化数据（无函数、无 `Date` 对象、无 `Map`）。
- **类型不匹配**：Dto/Vo schema 与前端预期可能不一致。
- **鉴权上下文**：Server Component、Route Handler、Server Action 的 session 可用性不同。
- **渲染模式**：Server / Client Component 能力与约束不同。
- **异步时序**：SWR 缓存、stale 数据、竞态。

## 核心原则

1. **先搜后写**：创建新东西前先搜现有模式（`rg`）。
2. **先想后码**：5 分钟清单省 50 分钟调试。
3. **显化假设**：把隐含假设写出来。
4. **核对所有层**：一处改动常需多处同步。
5. **从 bug 学习**：修完非平凡 bug 后补充到本目录。

## 修改前铁律

> 改任何值之前，先搜！

```bash
rg "要改的值" --type ts
rg "CONFIG_NAME" --type ts -c   # 看有几个文件定义它
```

这一条习惯能避免大多数"忘了改 X"的 bug。
