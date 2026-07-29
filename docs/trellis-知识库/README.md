# Trellis 官方中文文档知识库

> 来源：https://github.com/mindfold-ai/docs（`zh/` 目录）
> 整理日期：2026-07-29
> 文件数：34 篇核心使用文档

---

## 导航目录

### 入门

| 文档                                                             | 说明                                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [index.mdx](./index.mdx)                                         | Trellis 是什么、核心概念速览、vs 传统方法对比                                       |
| [install-and-first-task.mdx](./start/install-and-first-task.mdx) | 安装、初始化、平台配置、目录结构、第一个任务                                        |
| [how-it-works.mdx](./start/how-it-works.mdx)                     | 12 步详解：从会话启动到任务归档的完整流程                                           |
| [everyday-use.mdx](./start/everyday-use.mdx)                     | 命令参考、Skill 参考、任务管理、规范编写（**最全面的日常使用手册**）                |
| [real-world-scenarios.mdx](./start/real-world-scenarios.mdx)     | 7 个真实业务场景：新项目、存量项目、功能交付、重构、bug 修复、Review 沉淀、团队推广 |

### 核心概念

| 文档                                    | 说明                                       |
| --------------------------------------- | ------------------------------------------ |
| [overview.mdx](./concepts/overview.mdx) | Specs / Tasks / Workspace 三个系统怎么配合 |

### 进阶

| 文档                                                                                    | 说明                                                               |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [architecture.mdx](./advanced/architecture.mdx)                                         | 架构全景：设计理念、Feature 到模块映射、生成文件说明               |
| [configuration.mdx](./advanced/configuration.mdx)                                       | `.trellis/config.yaml` 所有配置项参考                              |
| [custom-workflow.mdx](./advanced/custom-workflow.mdx)                                   | 定制 Workflow：改面包屑、加自定义状态、改 Skill 路由               |
| [custom-commands.mdx](./advanced/custom-commands.mdx)                                   | 定制 Slash 命令：文件格式、平台差异、编写示例                      |
| [custom-agents.mdx](./advanced/custom-agents.mdx)                                       | 定制 Sub-agent：定义格式、平台差异、新建 agent                     |
| [custom-hooks.mdx](./advanced/custom-hooks.mdx)                                         | 定制 Hook：事件类型、配置、原生 hook 说明、编写自定义 hook         |
| [custom-skills.mdx](./advanced/custom-skills.mdx)                                       | 定制 Skill：Command vs Sub-agent vs Skill 选型、文件格式、触发条件 |
| [custom-spec-template-marketplace.mdx](./advanced/custom-spec-template-marketplace.mdx) | 构建自定义 Spec 模板市场：仓库结构、index.json、维护流程           |
| [multi-platform.mdx](./advanced/multi-platform.mdx)                                     | 17 个平台的能力矩阵、各平台布局、多开发者协作、版本管理            |
| [channel.mdx](./advanced/channel.mdx)                                                   | 多 Agent 协作：One-shot、多轮审查、并行 Reviewer、Forum Channel    |
| [roadmap.mdx](./advanced/roadmap.mdx)                                                   | Roadmap：v0.6 已交付、v0.7 计划                                    |

### 指南

| 文档                                  | 说明                                            |
| ------------------------------------- | ----------------------------------------------- |
| [commands.mdx](./guides/commands.mdx) | Slash Commands 是什么、内置命令、创建自定义命令 |
| [specs.mdx](./guides/specs.mdx)       | 怎么写 AI 会真正遵循的规范：好规范 vs 差规范    |
| [tasks.mdx](./guides/tasks.mdx)       | 用任务系统追踪工作：创建、管理、工作流          |

### 技能市场

| 文档                                                                                       | 说明                          |
| ------------------------------------------------------------------------------------------ | ----------------------------- |
| [index.mdx](./skills-market/index.mdx)                                                     | 技能市场概览                  |
| [trellis-meta.mdx](./skills-market/trellis-meta.mdx)                                       | 定制 Trellis 的元技能         |
| [trellis-spec-bootstrap.mdx](./skills-market/trellis-spec-bootstrap.mdx)                   | 从真实代码库生成项目 spec     |
| [frontend-fullchain-optimization.mdx](./skills-market/frontend-fullchain-optimization.mdx) | Web Vitals 驱动的前端性能优化 |
| [mem-recall.mdx](./skills-market/mem-recall.mdx)                                           | 跨平台回看 AI 历史对话        |

### 模板

| 文档                                           | 说明                                            |
| ---------------------------------------------- | ----------------------------------------------- |
| [specs-index.mdx](./templates/specs-index.mdx) | 可用的 Spec 模板：Electron、Next.js、CF Workers |

### 博客

| 文档                                                                      | 说明                               |
| ------------------------------------------------------------------------- | ---------------------------------- |
| [use-k8s-to-know-trellis.mdx](./blog/use-k8s-to-know-trellis.mdx)         | 用 K8s 类比理解 Trellis 的设计思想 |
| [ai-collaborative-dev-system.mdx](./blog/ai-collaborative-dev-system.mdx) | 在真实项目中搭建 AI 协作开发系统   |

### 附录

| 文档                                        | 说明                    |
| ------------------------------------------- | ----------------------- |
| [appendix-a.mdx](./advanced/appendix-a.mdx) | 关键文件路径速查        |
| [appendix-b.mdx](./advanced/appendix-b.mdx) | 命令与 Skill 速查       |
| [appendix-c.mdx](./advanced/appendix-c.mdx) | `task.json` Schema 参考 |
| [appendix-d.mdx](./advanced/appendix-d.mdx) | JSONL 配置格式参考      |
| [appendix-f.mdx](./advanced/appendix-f.mdx) | FAQ（28 个常见问题）    |

---

## 推荐阅读顺序

1. **快速了解**：`index.mdx` → `concepts/overview.mdx`
2. **上手使用**：`start/install-and-first-task.mdx` → `start/how-it-works.mdx`
3. **日常参考**：`start/everyday-use.mdx`（命令、Skill、任务、规范全覆盖）
4. **按需深入**：`advanced/` 下的定制文档、`guides/` 下的指南
5. **解决问题**：`advanced/appendix-f.mdx`（FAQ）
