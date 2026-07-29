# 实现前清单

> 目的：写代码**前**问对问题，避免常见架构错误。

## 为什么需要

多数代码质量问题不是实现时漏的，而是**一开始就设计错了**：

| 问题 | 根因 | 代价 |
| --- | --- | --- |
| 常量在 5 个文件里重复 | 没问"这值别处会用吗？" | 重构 + 测试 |
| 同一逻辑在多个 hook 重复 | 没问"这模式已存在吗？" | 事后抽抽象 |
| 跨层类型不匹配 | 没问"谁还消费这数据？" | 调试 + 修 |
| 前端手写了重复的 Dto/Vo 类型 | 没问"这类型已导出吗？" | 校验不一致 |
| Route Handler 重复造轮子 | 没问"有类似端点吗？" | API 面膨胀 |

## 清单

### 1. 常量与配置

加常量/配置值前：

- [ ] **跨层复用？** 前端和后端都用？
  - 是 → 放共享处（如 `src/shared/lib/zod/schemas/` 或对应 shared segment）
- [ ] **多处用？** 同层 2+ 文件用？
  - 是 → 放该层共享常量文件
- [ ] **魔法值？** 硬编码、可能变？
  - 是 → 提具名常量 + 注释说明
- [ ] **环境相关？** dev/staging/prod 不同？
  - 是 → 环境变量 + 校验

### 2. 逻辑与模式

实现逻辑前：

- [ ] **已有模式？** 先搜：

```bash
rg "debounce" src/
rg "useDebounce" src/        # 经 @/shared/hooks barrel
```

- [ ] **会重复？** 2+ 处需要？
  - 是 → 先建共享 hook/工具再用
- [ ] **已有数据 hook？** 该数据是否已有 SWR 请求封装？
  - 搜 `entities/*/api/`，能扩展先扩展
- [ ] **Server 还是 Client？** 需要交互？
  - 否 → 保持 Server Component
  - 是 → 只把交互部分抽成 Client Component

### 3. 类型与 schema

定义类型前：

- [ ] **已有 Zod schema？** 该数据形状是否已有 Dto/Vo schema？
  - 查 `src/shared/lib/zod/schemas/`：`rg "Schema = z.object" src/shared/lib/zod/`
  - 用 `z.infer<typeof xxxSchema>` 派生，禁手写重复类型
- [ ] **已有类型？** 先搜 `rg "interface.*Name\|type.*Name" src/`
- [ ] **跨层类型？** 跨 Route Handler 边界？
  - 是 → schema 定义在 `zod/schemas/`，导出推断类型；前端 import 不重定义

### 4. UI 组件

建组件前：

- [ ] **Server 还是 Client？**
  - 事件处理/hooks/浏览器 API → `"use client"`
  - 否则保持 Server Component
- [ ] **已有组件？** 先查 `src/shared/ui`（shadcn）和同 slice
- [ ] **图标？** 经 `Icons.xxx`，不在业务代码直接 import `@tabler/icons-react`

### 5. Route Handler / Server Action

写后端入口前：

- [ ] **已有端点？** `app/api/**` 是否已有类似 Route Handler？
  - 能扩展先扩展
- [ ] **Route Handler 还是 Server Action？**
  - 表单提交 / RSC 内变更 / 需 `revalidatePath` → Server Action
  - 稳定 URL / 外部或 API Key 调用 / 明确 REST 语义 → Route Handler
- [ ] **鉴权级别？** 用 `withPersonal`（需套餐/权限点）/ `withSession`（只需登录）；Server Action 用 `authUserActionClient`/`actionClient`
- [ ] **Dto/Vo 定义了？** 入参 Dto、出参 Vo 都是 Zod schema

### 6. 数据库

改/查数据库前：

- [ ] **无循环内 `await`**（N+1）→ 用 `in` 批量查 + 内存关联
- [ ] **批量写用 `createMany`/`updateMany`**
- [ ] **事务**：多表写操作用 `prisma.$transaction`
- [ ] **schema 改动**：走 `prisma:generate` + `prisma:migrate`，禁手改 `generator/`

### 7. 依赖

加依赖前：

- [ ] **已装？** 查 `package.json`
- [ ] **内置替代？** 如 `structuredClone()` 代 `lodash.cloneDeep`
- [ ] **bundle 影响？** 显著增大 client bundle？
  - 是 → 考虑动态 import 或 server-only

## 决策树

```
加值/常量？
├ 前后端都用？ → shared segment
├ 同层 2+ 文件？ → 该层共享常量
└ 单文件？ → 局部常量

加逻辑？
├ 已有模式？ → 复用/扩展
├ 2+ 处用？ → 先建共享 hook/工具
└ 单处？ → 直接实现（记录模式）

加类型？
├ 有 Zod schema？ → z.infer 派生
├ 跨 Route Handler 边界？ → 定义在 zod/schemas，他处 import
└ 仅本地？ → 本地定义

加组件？
├ 需交互？ → 'use client'
├ 纯展示？ → Server Component
└ 混合？ → Server 外壳 + Client 交互部分

加后端入口？
├ 表单/RSC 变更？ → Server Action (authUserActionClient)
├ 稳定 URL/外部调用？ → Route Handler (withPersonal/withSession)
└ 扩展现有？ → 优先扩展
```

## 反模式

```ts
// ❌ 手写镜像 Zod schema 的类型
interface Record { id: string; name: string; createdAt: Date }
// ✅ 从 schema 派生
import type { RecordVo } from "@/shared/lib/zod/schemas/...";

// ❌ 不必要的 'use client'
"use client";
export function Card({ name }) { return <div>{name}</div>; } // 无交互！

// ❌ Client 里请求本可 Server 直查的数据（无交互时）
"use client";
export function List() {
  const { data } = useSWR(...);
  return <ul>{...}</ul>;
}
// ✅ Server Component 直查（无交互时），有交互再下沉

// ❌ handler 手写错误 JSON
return NextResponse.json({ error: "..." }, { status: 400 });
// ✅ 抛 AiSpecError，由 withPersonal/withSession 统一归一
throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "..." });
```

## 何时用

| 触发 | 动作 |
| --- | --- |
| 要加常量 | 过 §1 |
| 要实现逻辑 | 过 §2 |
| 要定义类型/schema | 过 §3 |
| 要建组件 | 过 §4 |
| 要加 Route Handler / Server Action | 过 §5 |
| 要查/改数据库 | 过 §6 |
| 要加依赖 | 过 §7 |
| 觉得似曾相识 | **停**，先搜 |

> 核心原则：5 分钟清单思考省 50 分钟重构。
