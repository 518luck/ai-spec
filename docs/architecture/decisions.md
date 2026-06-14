# 架构决策记录（ADR）

> 本文件记录 AI Spec 项目关键技术决策的背景、理由与被否决的方案。
> 提出新技术选型、重构、改方向前，先确认是否与已有 ADR 冲突。
> 每个 ADR 末尾标注「何时应重新评估」，避免僵化执行。

## ADR 格式说明

每条决策包含五个部分：

- **背景**：为什么需要做这个决策
- **决策**：最终选了什么
- **理由**：为什么这样选
- **否决的方案**：考虑过但放弃的其他选项及放弃原因
- **何时应重新评估**：满足什么条件时应重新打开这条决策讨论

---

## ADR-001：后端保留 TypeScript，不重写 Go

### 背景

项目要引入富文本协同编辑（WebSocket），协同服务不能部署到 Vercel（不支持长连接）。同时开发体验已出现「要开多个进程」的繁琐感。在此背景下，曾讨论是否趁机把后端从 TypeScript（Next.js 全栈）重构为 Go，以获得更好的并发性能和部署灵活性。

### 决策

**后端保留 TypeScript，不重写 Go。** WebSocket 服务用 Node（Hono/Fastify + Yjs）实现。

### 理由

1. **团队现实**：一人开发，Go 仅掌握基础语法。把 `next-auth` + RBAC + BullMQ + Prisma + 邮件 + 存储 + 日志全套基础设施用 Go 重写，是不可完成的工作量。
2. **富文本协同本身极复杂**：冲突解决、光标同步、撤销栈是前端工程里最难的领域，会吃掉绝大部分精力，没有余力同时学 Go 进阶。
3. **Node 跑协同引擎够用**：Yjs 在生产环境验证过能支撑几万 WebSocket 连接，Go 的并发优势在本项目规模用不上。
4. **前后端类型共享是 Next.js 全栈的核心红利**：zod schema、Prisma 类型前端可直接复用。换 Go 会永久丢失这个优势，且需要重新设计类型契约（OpenAPI/gRPC）。
5. **两个痛点都不是语言问题**：
   - 「开发要开多进程」→ 工程编排问题，Go 也要起多服务
   - 「WebSocket 不能部署 Vercel」→ 平台约束，独立部署即可，与语言无关

### 否决的方案

- **全量重写为 Go**：成本远超收益，且会丢失类型共享。一人 + Go 基础语法的组合下风险极高。
- **双语言（核心业务保留 TS，性能敏感服务用 Go）**：当前规模无性能敏感服务，过早引入双语言增加心智负担。

### 何时应重新评估

- 单机出现十万级以上 WebSocket 连接
- 引入 CPU 密集型 OT 计算
- 团队扩招到有熟练 Go 工程师，且某服务确实撞 Node 性能墙

---

## ADR-002：采用 pnpm workspace + turborepo

### 背景

项目要承载多个独立服务（web、worker、realtime），需要决定 monorepo 的工具栈。

### 决策

**pnpm workspace + turborepo**。包命名前缀用 `@repo/`（见 ADR-003）。

### 理由

1. **pnpm workspace**：磁盘占用低、安装快、严格的依赖隔离（避免幽灵依赖）。
2. **turborepo**：
   - 任务编排能力强，`turbo dev` 一条命令并行拉起所有服务
   - 内容哈希缓存，构建加速
   - 依赖图感知，按包依赖顺序执行
   - 配置比 Nx 轻，学习成本低
3. **`@repo/` 前缀**：turborepo 官方惯例，社区约定俗成。

### 否决的方案

- **纯 `concurrently`（无 turborepo）**：能解决「同时启动」，但缺缓存、依赖图、任务拓扑。服务一多就会乱。
- **npm-run-all**：功能和 concurrently 类似，更老牌，但生态不及 turborepo。
- **Nx**：功能比 turborepo 强大，但配置复杂、心智负担重，对一人项目过重。
- **保持单体**：无法承载 realtime 等独立服务的演进。

### 何时应重新评估

- 仓库包数量超过 20 个，turborepo 的任务图变得难以管理
- 需要更细粒度的依赖分析或代码生成（Nx 的强项）

---

## ADR-003：包命名前缀用 `@repo/`

### 背景

monorepo 里多个 package 需要一个命名前缀，避免和 npm 公共包冲突。

### 决策

所有内部包用 `@repo/` 前缀，例如 `@repo/web`、`@repo/db`、`@repo/shared`。

### 理由

1. turborepo 官方文档和 `create-turbo` 脚手架默认就用这个前缀，社区约定。
2. 短、好记、明确表达「仓库内部包」语义。
3. 与 npm 公共包命名空间（`@scope/`）天然区分。

### 否决的方案

- `@ai-spec/`：用项目名做 scope，更个性化但偏离惯例。
- 无前缀（直接 `web`、`db`）：与公共包易冲突，且 import 时辨识度低。

### 何时应重新评估

- 项目要发布为开源/对外 npm 包，需要正式 npm scope 时
- 组织内有多个 monorepo，需要用 scope 区分

---

## ADR-004：阶段 1 走「最小骨架」，不抽 packages

### 背景

开始做 monorepo 时，曾讨论是否在阶段 1 就把 `src/shared/lib/infrastructure/` 下的纯基础设施（queue/redis/storage/email）和 Prisma 抽到 `packages/shared` + `packages/db`，同时把 worker 拆成 `apps/worker`。

### 决策

**阶段 1 只搭骨架，不抽任何 packages。** 整个 Next.js 项目整体平移进 `apps/web/`，worker.ts 暂留 web 内，用 `concurrently` 在 web 包内并行运行 next + worker。`packages/` 留空占位。

### 理由

1. **worker 当前只有一个头像同步任务**，独立成包属过度工程。
2. **整体平移零风险**：项目内所有路径都是相对路径（`@/*` 别名、Prisma output 的 `../../`、worker 的 `./src/...`），整体搬进 `apps/web/` 后相对关系完全不变，几乎不用改任何 import。
3. **避免一次性大重构**：改十几个文件的 import 容易出错，且阶段 1 还没有 realtime，提前抽属 YAGNI。
4. **核心价值已能达到**：阶段 1 的目标是让 `turbo dev` 一条命令拉起所有进程，这个目标不依赖 packages 拆分。

### 否决的方案

- **阶段 1 半彻底（抽 queue/redis/db，独立 worker）**：2-3 天工作量，改 import 易错，且 worker 现在太轻不值得独立。
- **阶段 1 一步到位（抽全部 shared）**：最干净但工作量最大，且 auth/actions 这类 Next 死耦合代码永远不该抽。

### 何时应重新评估

满足任一条件时，应启动阶段 2（抽 packages）：
- worker 任务数 > 5 个
- worker 影响 next dev 启动速度或热更新
- 即将开始做 realtime 服务
- 出现第三个需要复用基础设施的进程

---

## ADR-005：富文本协同用 Tiptap + Yjs + Hocuspocus

### 背景

要做富文本协同编辑（类似飞书文档、Notion），需要选择冲突解决算法、编辑器、实时服务三件套。

### 决策

- **冲突解决**：Yjs（CRDT）
- **编辑器**：Tiptap（基于 ProseMirror）
- **实时服务**：Hocuspocus（Tiptap 官方 Yjs 服务端），自托管

### 理由

1. **Yjs 是 CRDT 事实标准**：生态最成熟，富文本场景验证最充分。相比 OT，CRDT 不需要中心化协调服务器，去中心化更灵活。
2. **Tiptap 和 Yjs 集成最好**：官方维护 `y-prosemirror` 桥接，文档完善，一人开发首选。
3. **Hocuspocus 专为 Yjs 设计**：带 auth hook、持久化扩展、可水平扩展，比裸 `y-websocket` 更适合生产。
4. **自托管优先**：保留对数据主权和性能调优的控制。

### 否决的方案

- **Socket.IO**：本质是消息总线，不懂「文档状态合并」，富文本协同必须用 CRDT/OT 引擎。Socket.IO 只能做传输层。
- **OT（Operational Transformation）**：实现复杂（需中心化协调、转换函数极难写对），新项目不推荐。
- **Automerge（另一个 CRDT 库）**：更「纯」CRDT，但生态不如 Yjs，富文本支持弱。
- **Liveblocks / Tiptap Cloud / PartyKit**：托管 SaaS，省事但有持续费用和数据主权顾虑。可作为自托管跑通后的备选。
- **Lexical（Meta）编辑器**：现代，但 Yjs 集成生态不如 Tiptap 成熟。

### 何时应重新评估

- 自托管 Hocuspocus 运维负担过重 → 评估 Liveblocks/PartyKit
- Yjs 文档体积过大导致性能问题 → 评估分块策略或 Automerge
- 需要非 ProseMirror 系的编辑能力（如富表格、画布）→ 评估 Lexical

---

## ADR-006：worker 阶段 1 留在 web 内，不独立成包

### 背景

worker.ts 当前职责是消费 BullMQ 队列（目前仅头像同步一个任务）。需要决定它是否在阶段 1 就独立成 `apps/worker` 包。

### 决策

**worker 留在 `apps/web` 包内**，通过 `concurrently` 在 web 包的 `dev` 脚本里并行启动 next + worker。worker.ts 文件位置：`apps/web/worker.ts`。

### 理由

1. **当前任务量极轻**：只有头像同步一个任务，独立成包的工程成本（抽 queue/redis/db、配独立 tsconfig/package.json）远大于收益。
2. **依赖路径自然成立**：worker.ts 通过相对路径（`./src/shared/...`）引用 web 内的 queue/redis 代码，整体平移后路径不变。
3. **保持 import 稳定**：阶段 1 不动 `@/shared/...` 别名，零改动风险。

### 否决的方案

- **阶段 1 就独立成 `apps/worker`**：必须同步抽 queue/redis/db 到 packages（见 overview.md 关键认知点 2），工作量 2-3 天，且 worker 太轻不值得。
- **worker 内联进 Next.js 进程（用 instrumentation/route handler 启动）**：Next 进程和 worker 职责混在一起，重任务会影响 web 响应，且无法独立扩缩容。

### 何时应重新评估

满足任一条件时，应把 worker 拆成 `apps/worker`（并同步启动阶段 2 抽 packages）：
- worker 任务数 > 5 个，或单个任务变重（如 AI 推理、大批量邮件）
- worker 内存/CPU 占用影响 web 进程稳定性
- 需要独立部署、独立扩缩容
- 出现 worker 和 web 必须用不同运行时配置的场景
