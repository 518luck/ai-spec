# BullMQ 队列设计约束

## 核心原则

- **禁止为每种任务类型创建独立队列**：不要一个 job type 一个 queue。成百上千的
  queue 难以管理、运维和监控。
- **单一队列 + 命名任务分发**：使用 1 个 queue 承载多种 job，通过 `name` 字段
  区分，在 worker 内用 switch（或任务注册表）路由到对应处理逻辑。

## 何时需要例外

仅当存在以下**强需求**时，才考虑拆分队列或使用 BullMQ Pro 的 groups 功能：

- 不同 job name 之间需要**均匀/隔离**的处理能力（某类任务不能饿死另一类）。
- 需要**优先级隔离**或**独立的并发/限流策略**。

没有上述需求时，不要因为"看起来更整洁"就拆 queue。

## 实现要求

1. **集中分发**：worker 处理函数内部按 `job.name` 分派，所有 job 类型共用同一
   个队列与 worker 实例。
2. **任务注册表优于裸 switch**：当 job 类型较多时，使用 `{ [name]: processor }`
   注册表结构代替冗长的 switch，便于扩展。
3. **输入/输出类型**：queue 的泛型默认面向单一 job 类型，混合多种 job 时：
   - 定义联合类型或按 name 区分的判别联合（discriminated union）作为 payload。
   - 在 processor 内通过 name 收窄类型，避免 `any`。
4. **命名约定**：job 的 `name` 使用稳定的字符串常量（枚举或 `as const` 对象），
   生产端与消费端共用，避免魔法字符串。

## 反模式（禁止）

- ❌ `new Queue('email')`、`new Queue('image')`、`new Queue('report')` ... 每个
  业务各起一个 queue。
- ❌ 为绕开类型问题而把多种 job 拆成多个 queue。
- ❌ 用 `any` 牺牲多 job 类型下的类型安全。
