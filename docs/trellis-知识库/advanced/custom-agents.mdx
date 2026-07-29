---
title: '定制 Sub-agent'
---

## 定制 Sub-agent

Trellis 原生带有 3 个 sub-agent（`trellis-implement`、`trellis-check`、`trellis-research`）。你可以修改它们或新增自己的。本章以 Claude Code 格式作为主要例子，再列出其他平台的 frontmatter 差异。

<Note>
  Sub-agent 在 14 个配置平台里有 11 个可用：Claude Code、Cursor、OpenCode、Codex、Kiro、Gemini
  CLI、Qoder、CodeBuddy、Copilot、Droid、Pi Agent。agent 文件格式按平台分 Markdown / TOML /
  JSON；没有 sub-agent `PreToolUse` hook 或 extension 等价机制的平台，sub-agent 自己通过 pull-based
  prelude 读取自己的 JSONL manifest、`prd.md`、存在时的 `design.md`、存在时的 `implement.md`，不靠
  hook 注入。Codex 也可以跑 inline 模式，此时主会话通过 skill 读取同一批
  artifact。Kilo、Antigravity、Devin 没有 sub-agent 原语——implement / check 在主会话里内联完成。
</Note>

### Sub-agent 定义（Claude Code 示例）

Sub-agent 定义文件在 `.claude/agents/{name}.md`，使用 YAML frontmatter：

```markdown
---
name: agent-name
description: |
  这个 sub-agent 做什么的一句话说明，平台据此决定何时 spawn。
tools: Read, Write, Edit, Bash, Glob, Grep
---

# Agent Name

Sub-agent 的指令写在这里。把它当成 sub-agent 的 system prompt。
```

Claude Code 上的关键 frontmatter 字段：

| 字段          | 含义                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| `name`        | Sub-agent 标识，在 `Task(subagent_type="...")` 调用里使用                        |
| `description` | 主会话据此决定何时 spawn 该 sub-agent                                            |
| `tools`       | 用逗号分隔的 sub-agent 可调用工具列表                                            |
| `model`       | 可选的模型覆盖。建议省略，让它继承会话模型，避免 Cursor 等用户被强制按 Opus 计费 |

### Sub-agent 文件格式按平台不同

文件扩展名、frontmatter 形状、工具声明语法各平台不一样：

| 平台        | 文件                             | 工具 / 权限字段                              | 示例                                                               |
| ----------- | -------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| Claude Code | `.claude/agents/{name}.md`       | `tools:`（逗号列表）                         | `Read, Write, Edit, Bash, Glob, Grep, Task, Skill`                 |
| Claude Code | （MCP 工具）                     | 同字段、加前缀                               | `mcp__exa__web_search_exa`、`mcp__chrome-devtools__*`              |
| Cursor      | `.cursor/agents/{name}.md`       | CC 风格 `tools:` 逗号列表                    | `Read, Write, Edit, Bash`                                          |
| OpenCode    | `.opencode/agents/{name}.md`     | `permission:`（对象）                        | `{ read: allow, write: allow, bash: allow, "mcp__exa__*": allow }` |
| Codex       | `.codex/agents/{name}.toml`      | TOML `sandbox_mode` + 工具开关               | `sandbox_mode = "workspace-write"`                                 |
| Kiro        | `.kiro/agents/{name}.json`       | JSON `tools:`（小写数组）                    | `["read", "write", "bash"]`                                        |
| Gemini CLI  | `.gemini/agents/{name}.md`       | CC 风格 `tools:` 逗号列表                    | `Read, Write, Edit, Bash`                                          |
| Qoder       | `.qoder/agents/{name}.md`        | CC 风格 `tools:` 逗号列表                    | `Read, Write, Edit, Bash`                                          |
| CodeBuddy   | `.codebuddy/agents/{name}.md`    | CC 风格 `tools:` 逗号列表                    | `Read, Write, Edit, Bash`                                          |
| Copilot     | `.github/agents/{name}.agent.md` | CC 风格 `tools:` 逗号列表                    | `Read, Write, Edit, Bash`                                          |
| Droid       | `.factory/droids/{name}.md`      | CC 风格 `tools:` 逗号列表                    | `Read, Write, Edit, Bash`                                          |
| Pi Agent    | `.pi/agents/{name}.md`           | CC 风格 `tools:` 逗号列表 + extension 上下文 | `Read, Write, Edit, Bash`                                          |

### Pi Agent 的 model 和 thinking 配置

Pi sub-agent 定义放在 `.pi/agents/{name}.md`。文件也是 Markdown + YAML frontmatter，字段和 Claude 风格 agent 接近，并额外支持 Pi 运行配置：

```markdown
---
name: trellis-review
description: |
  Reviews the current diff and reports correctness issues.
tools: Read, Write, Edit, Bash, Glob, Grep
model: anthropic/claude-sonnet-4
thinking: high
fallbackModels:
  - openai/gpt-5-mini
---

# trellis-review

Review the current diff against the active Trellis task and project specs.
```

Pi extension 会在启动子 Pi 进程前读取这些 frontmatter。它会用 text/no-session 模式启动嵌套 agent，转发当前 Trellis context id，并把运行配置映射成 Pi CLI args：

| 配置                 | 子 Pi args                                                        |
| -------------------- | ----------------------------------------------------------------- |
| `model` + `thinking` | 当 model 没有 thinking suffix 时使用 `--model <model>:<thinking>` |
| 只有 `model`         | `--model <model>`                                                 |
| 只有 `thinking`      | `--thinking <level>`                                              |

单次调用 Pi `subagent` tool 时传入的 `model` / `thinking` 会覆盖 frontmatter，只影响这一次子进程。`fallbackModels` / `fallback_models` 会被解析，用来兼容 pi-subagents 风格的 agent 文件；但 Trellis 不会把它传给 Pi CLI，因为 Pi 目前没有 documented stable fallback-model flag。

如果自定义 sub-agent 也要拿 task context，约定一个 task-local JSONL 文件，然后扩展 `.pi/extensions/trellis/index.ts` 处理这个新的 sub-agent 名字。Pi Agent 不加载 Python hook 脚本。

写多平台通用的 sub-agent 时，把 Claude Code 版放在 `packages/cli/src/templates/claude/agents/` 作为规范版，`packages/cli/src/configurators/` 里各平台适配把 frontmatter 翻译成原生语法。原生的 `trellis-implement` / `trellis-check` / `trellis-research` 就是这么做的。

### 修改原生 sub-agent

示例：给 `trellis-check` 加 timeout 和更严的工具预算。

```markdown
---
name: trellis-check
description: |
  代码质量检查专家。对 diff 比对 spec，跑 lint/typecheck/test，自修复。
tools: Read, Write, Edit, Bash, Glob, Grep
timeout: 600000
---
```

如果这个改动要推给全团队，把它放在 `.trellis/spec/backend/`（或你团队约定的位置）里，让 sub-agent 的行为通过 spec 注入改变，而不是 fork agent 定义。

### 新建 sub-agent

示例：一个 `trellis-test` sub-agent，为当前 diff 写测试。

````markdown
---
name: trellis-test
description: |
  为当前 diff 写全面的测试，跑测试并汇报通过 / 失败。
tools: Read, Write, Edit, Bash, Glob, Grep
---

# trellis-test

你在 Trellis 工作流里是 trellis-test sub-agent。

## 职责

1. 分析当前 diff，识别可测单元。
2. 为新函数和组件写单元测试。
3. 为跨模块交互写集成测试。
4. 跑测试套件并汇报结果。

## 流程

#### 拿变更

```bash
git diff --name-only HEAD
```

#### 识别可测代码

对每个变更文件，找出需要测试的函数或组件。

#### 写测试

沿用仓库已有的测试模式，不要自创风格。

#### 跑测试

```bash
pnpm test
```
````

### 上下文注入

如果希望你的 sub-agent 像原生 sub-agent 那样拿到 task 和 spec 上下文：

1. 约定一个 JSONL 命名（如 `test.jsonl`）放在每个 task 目录下。
2. 读取顺序保持一致：先 JSONL 条目，再 `prd.md`，再读取存在时的 `design.md`，最后读取存在时的 `implement.md`。
3. 在有 sub-agent `PreToolUse` hook 或 extension 等价机制的平台（Claude Code、Cursor、OpenCode、CodeBuddy、Droid、Pi Agent）上，编辑 `inject-subagent-context` 或 Pi extension，让它处理这个新 sub-agent 类型。
4. 在没有该注入点的平台（Codex、Kiro、Gemini、Qoder、Copilot）上，参照原生 sub-agent 的 pull-based prelude 模式：在 agent 文件头部加一段要求 sub-agent 动手前先 `Read` 自己的 JSONL 和 task artifacts。

详细走查见[定制 Hooks](./custom-hooks)。

---
