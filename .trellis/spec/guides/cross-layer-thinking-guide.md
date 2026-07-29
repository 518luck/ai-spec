# 跨层思维指南

> 目的：跨多层功能的实现前清单。核心：30 分钟思考省 3 小时调试。

## 何时用

功能满足任一条件就用：

- 跨 3+ 层（Server Component、Client Component、Route Handler/Server Action、数据库）
- 层间有数据转换
- 有实时/事件驱动组件
- 接收外部数据（API、webhook、文件上传）

## 实现前清单

### 1. 涉及哪些层

- [ ] Server Component（RSC，数据获取）
- [ ] Client Component（交互、SWR）
- [ ] Route Handler（校验、业务逻辑）
- [ ] Server Action（表单、变更）
- [ ] Middleware（鉴权、限流）
- [ ] 数据库（Prisma、迁移）
- [ ] 外部服务（第三方 API、webhook）

### 2. 数据流方向

```
读：DB → Prisma → Route Handler/Server Action → Vo → SWR/props → 组件 → UI
写：UI → 表单/Action → Server Action/Route Handler → 业务逻辑 → Prisma → DB
SSR：DB → Prisma → Server Component → HTML → Client Hydration
```

### 3. 各层数据格式

| 层 | 格式 | 例 |
| --- | --- | --- |
| 数据库 | SQL 类型 | `TEXT`/`INTEGER`/`TIMESTAMP`/`JSONB` |
| Prisma | TS 类型 | `string`/`number`/`Date`/`Record<>` |
| Route Handler/Action | Zod 校验对象 | `{ id: string, createdAt: Date }` |
| HTTP 响应 | 序列化 JSON | `{ id: "abc", createdAt: "2024-..." }` |
| SWR | 缓存响应 | 同 HTTP 响应（反序列化）|
| Server Component props | 必须可序列化 | 无函数、无 `Date`、无类实例 |
| Client Component | React state | props、hook 返回值 |

### 3.1 序列化边界（关键！）

跨 Server/Client Component 边界的数据必须可序列化。

| 可序列化 ✅ | 不可序列化 ❌ |
| --- | --- |
| `string`/`number`/`boolean`/`null` | `Date` 对象 |
| 普通对象/数组 | `Map`/`Set` |
| | 函数/类实例 |

陷阱：

```tsx
// ❌ Date 跨 RSC 边界会出问题
async function Page() {
  const r = await getRecord(id); // createdAt 可能是 Date
  return <ClientCard record={r} />;
}
// ✅ 先转 ISO 字符串
return <ClientCard record={{ ...r, createdAt: r.createdAt.toISOString() }} />;
```

### 4. 转换点

| 从 | 到 | 谁负责 | 位置 |
| --- | --- | --- | --- |
| DB 时间戳 | JS Date | Prisma | 自动 |
| JS Date | ISO 字符串 | 序列化 / 显式转换 | 响应 / props |
| ISO 字符串 | 显示串 | 组件 | UI 层 |
| 用户输入 | 校验数据 | Zod Dto | 入口校验 |
| Prisma 对象 | Vo | 业务逻辑 | handler/action |

### 5. 边界问题

**RSC / Client 边界**：props 是否都可序列化？能否在 Server Component 直查而不用 SWR？

**Client / Route Handler 边界**：响应格式？SWR 如何缓存/失效？key 是否一致（数组 key）？

**Route Handler / 数据库边界**：时间戳一致（ISO vs Date）？ID 是 string？null vs undefined？JSONB 列处理？

**Middleware / Route 边界**：鉴权在 middleware 还是 handler？header/cookie 是否正确转发？

### 6. 鉴权上下文

| 层 | 鉴权方式 | 说明 |
| --- | --- | --- |
| Middleware | 检查 cookie/session | 路由级保护 |
| Server Component | `auth()` | 可服务端 redirect |
| Route Handler | `withPersonal`/`withSession`（内部 `resolveContext` + `auth()`）| 权威校验 |
| Server Action | `authUserActionClient`（内部 `auth()` 注入 `ctx.user`）| 权威校验 |

陷阱：鉴权只做在前端或只做在 middleware 都不够——Route Handler / Server Action **必须各自权威校验**。

### 7. 边界情况

- [ ] 数据为空/null？
- [ ] 数据库查询失败？
- [ ] 接口超时？
- [ ] 引用实体不存在？
- [ ] 用户操作中途离开？
- [ ] SWR 返回 stale 数据？
- [ ] 操作中途 session 过期？
- [ ] 双击重复提交？

## 常见模式

### A. Server Component 直查

```
Server Component → entities api（Prisma）→ Vo → 渲染 HTML
```
注意：Server→Client props 可序列化；服务端调用不进 SWR 缓存。

### B. Client + SWR

```
Client Component → SWR → fetcher(entities api) → Route Handler → Prisma
```
注意：处理 `isLoading`/`isError`；多维查询用数组 key；key 失效用 `mutate`。

### C. Server Action 变更

```
表单 → Server Action (authUserActionClient) → 业务逻辑 → Prisma → revalidatePath
```
注意：前后端都要校验（后端权威）；错误抛 `AiSpecError`。

### D. 鉴权链路

```
请求 → (middleware) → Route Handler (withPersonal/withSession) → resolveContext → auth()
```
注意：handler 是权威防线，middleware 只是路由级前置。

## 常见 bug 教训

| bug | 根因 | 预防 |
| --- | --- | --- |
| `Date` props 破坏 hydration | Server→Client 传了 Date | 跨边界先 `toISOString()` |
| 变更后 stale 数据 | 没失效 SWR key | 变更成功后 `mutate(["xxx", ...])` |
| API 鉴权被绕过 | 只在 middleware 鉴权 | handler 必须用 `withPersonal`/`withSession` |
| 条件查询发了 null ID 请求 | 没用条件 key | `useSWR(cond ? key : null, ...)` |
| handler N+1 | 循环内 await | `in` 批量 + 内存关联 |
| hydration mismatch | 服务端客户端渲染不一致（如时间） | 保证两端数据一致 |

## 跨层审查心态

不要只看"这行改了对不对"，要看"系统此刻状态对不对"。审查覆盖**所有数据出口**：Route Handler 响应、Server Component props、SWR 缓存、Server Action 返回、外部接口。

完成跨层功能前自问：
1. **出口**：是否检查了所有数据出口，而非只看"核心"那个？
2. **设计**：现有代码是否符合设计原则（而非"改动是否正确"）？
