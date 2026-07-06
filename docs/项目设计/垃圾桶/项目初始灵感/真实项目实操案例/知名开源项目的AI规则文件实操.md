# 真实项目的 AI 代码约束实操案例

> 来源：GitHub 上知名开源项目的 AGENTS.md / CLAUDE.md 实际内容。
> 这些都是**真实的、正在使用的**规则文件，不是理论。

---

## 案例一：Next.js（Vercel）— 约 700 行规则

**文件**: `github.com/vercel/next.js/blob/canary/AGENTS.md`

Next.js 是目前最详尽的 AI 规则文件之一，Vercel 团队将其视为项目协作的核心文档。

### 他们怎么做的

**1. 强制启动开发服务器**

> "If you are changing Next.js source or integration tests, start `pnpm --filter=next dev` in a separate terminal session before making edits"

AI 在修改代码前必须先启动 dev server，这样修改后可以立即验证。

**2. 禁止重复运行测试**

> "Never re-run the same test suite with different grep filters. Capture output once to a file, then read from it."

测试很慢，不要反复跑。把输出存到文件里，从文件里读结果。

**3. 禁止 AI 署名**

> "Do NOT add 'Generated with Claude Code' or co-author footers to commits or PRs"
> "Do NOT mark PRs as 'ready for review' — leave PRs in draft mode and let the user decide"

AI 产出的 PR 不能自作主张标记为 ready，不能添加 AI 生成标记。

**4. 任务拆分原则**

> "Split work into smaller, individually verifiable tasks. Before starting, break the overall goal into incremental steps where each step produces a result that can be checked independently."

**5. 安全审查规则**

> "When reviewing PRs: if new code reads a request header that is not a standard HTTP header, flag it for security review."

**6. 反模式清单（运行时/打包）**

- `require()` 必须在编译时 `if/else` 分支中，以支持 Dead Code Elimination
- Edge 构建中，必须将依赖 Node-only imports 的 feature flag 强制设为 `false`
- `react-server-dom-webpack/*` 的 import 必须留在 `entry-base.ts`

### 关键洞察

Vercel 的规则核心是**让 AI 能够自我验证**。每条规则都在回答一个问题："AI 做完之后，怎么知道做对了？"

---

## 案例二：Cline（VS Code AI 插件）— 约 500 行规则

**文件**: `github.com/cline/cline/blob/main/CLAUDE.md`

Cline 的规则文件自称是"在这个代码库中高效工作的秘密武器"，用于记录"部落知识"。

### 他们怎么做的

**1. 规则文件的维护规则**

> "When to add to CLAUDE.md:
>
> - User had to intervene, correct, or hand-hold
> - Multiple back-and-forth attempts were needed
> - Something worked differently than expected
> - **Proactively suggest additions** when any of the above happen"

> "What NOT to add: Stuff you can figure out from reading a few files, obvious patterns, or standard practices. This file should be high-signal, not comprehensive."

**这是对规则文件本身的元规则**——什么时候该加规则，什么时候不该加。

**2. "三文件规则"（跨文件一致性）**

> "You must update the proto conversion layer in THREE places or the provider will silently reset to Anthropic:
>
> 1. `proto/cline/models.proto` - Add to the `ApiProvider` enum
> 2. `convertApiProviderToProto()` - Add case mapping
> 3. `convertProtoToApiProvider()` - Add case mapping"

这是一个**极其具体的约束**——告诉 AI 新增 API Provider 时必须修改的三个位置，漏掉任何一个都会静默失败。

**3. Bug 模式记录**

> "When cancelled mid-operation, the status stays 'generating' forever — no one updates it. To detect cancellation, check TWO conditions: `!isLast` and `lastModifiedMessage?.ask === 'resume_task'`"

这是**记录已知的坑**，防止 AI 重复踩坑。

---

## 案例三：pnpm — 约 300 行规则

**文件**: `github.com/pnpm/pnpm/blob/main/AGENTS.md`

### 他们怎么做的

**1. 双栈同步规则**

> "Any user-visible change has to land in both TypeScript pnpm and Rust pacquet. When you change one side, do the equivalent change on the other in the same PR if you can."

这是**架构级别的约束**，确保 TypeScript 和 Rust 两侧保持一致。

**2. 禁止忽略测试失败**

> "Do not dismiss a failing test as a 'pre-existing' failure that is unrelated to your changes. Every test failure must be investigated and fixed."

**3. 代码复用优先**

> "Before writing new code, always analyze the existing codebase for similar functionality. Search before you write. Prefer open source packages over custom implementations."

**4. 注释策略**

> "Write code that explains itself. Do not write a comment that restates what the code already says. Write a comment only when the reason for the code is non-obvious."

**5. AI 签名**

> "When posting a comment, creating an issue, or opening a PR, append a footer indicating it was written by an agent. Example: `Written by an agent (Claude Code, claude-opus-4-7).`"

**6. 技术细节的坑**

> "Do not use `instanceof Error`. Jest runs tests in a VM context where `instanceof` checks can fail across realms. Instead, use `util.types.isNativeError()`."

---

## 案例四：Vercel AI SDK — 约 350 行规则

**文件**: `github.com/vercel/ai/blob/main/AGENTS.md`

### 他们怎么做的

**1. 架构决策记录（ADR）**

> "Before making changes that touch architecture (new dependencies, new patterns, API design, infrastructure), check existing ADRs. If your work would contradict an existing accepted ADR, stop and discuss with the human before proceeding."

AI 不能擅自违反已记录的架构决策，必须停下来跟人讨论。

**2. 禁止直接 JSON.parse**

> "Never use `JSON.parse` directly in production code to prevent security risks. Instead use `parseJSON` or `safeParseJSON` from `@ai-sdk/provider-utils`."

**3. 错误模式**

> "Every error extends `AISDKError` with a marker pattern for cross-realm `instanceof` checks."

统一的错误处理模式，AI 必须遵守。

---

## 案例五：Cal.com — 约 300 行规则

**文件**: `github.com/calcom/cal.com/blob/main/AGENTS.md`

### 他们怎么做的

**1. 明确的 Do/Don't 清单**

Do:

- Use `select` instead of `include` in Prisma queries
- Use `import type { X }` for TypeScript type imports
- Use early returns to reduce nesting
- Import directly from source files, not barrel files
- Only add comments that explain **why**, not **what**

Don't:

- Never use `as any`
- Never expose `credential.key` field in API responses
- Never modify `*.generated.ts` files directly
- Never put business logic in repositories
- Never use barrel imports from index.ts files
- Never create large PRs (>500 lines or >10 files)

**2. 分层决策框架**

| 类别          | 规则                                                                |
| ------------- | ------------------------------------------------------------------- |
| **Always do** | Type check, run tests, use `select` in Prisma, conventional commits |
| **Ask first** | Adding dependencies, schema changes, deleting files, full builds    |
| **Never do**  | Commit secrets, expose credential keys, use `as any`, force push    |

"Ask first" 这个分类很有价值——不是简单的允许/禁止，而是**"AI 拿不准的时候应该问人"**。

**3. PR 大小限制**

> "Keep PRs under 500 lines and under 10 files. Split by layer, feature component, refactor vs feature, or dependency order."

---

## 案例六：n8n — 约 350 行规则

**文件**: `github.com/n8n-io/n8n/blob/master/AGENTS.md`

### 他们怎么做的

**1. 安全修复的卫生规则**

> "When working on security fixes, never expose the attack vector or vulnerability type in any public-facing artifact. Attackers monitor open-source repos for signals like branch names, commit messages, PR titles."

具体规则：

- 分支名：不要用 Linear 建议的名字（如果它暴露了漏洞信息）
- Commit message：描述代码现在做了什么，而不是威胁是什么
- 测试描述：使用中性语言

**2. 设计原则**

> "Security improvements must NEVER add friction to the common-case building experience. Security should be invisible when it can be."

**3. 前端规则**

- 所有 UI 文本必须用 i18n
- 使用 CSS 变量，禁止硬编码 px 值
- `data-testid` 必须是单个值（不能有空格）

---

## 案例七：Elasticsearch — 约 350 行规则

**文件**: `github.com/elastic/elasticsearch/blob/main/AGENTS.md`

### 他们怎么做的

**1. 格式化规则**

> "Absolutely no wildcard imports; keep existing import order. In `switch` statements, do not use `default` as a branch for valid options — enumerate cases explicitly."

**2. 日志规则**

- 必须使用参数化日志：`logger.debug("operation [{}]", value)`
- 昂贵的日志构造要包在 supplier 里
- 只有当集群管理员可以采取行动时，才记录客户端引起的异常

**3. 必须先读 Javadoc 的方法**

> "`fullyLoadedAnalyzer`, `TestAnalyzer.statementError`, `TestAnalyzer.error`, `forciblyCast` — must read their javadoc before taking any other actions."

AI 在操作这些方法前，必须先读文档理解上下文。

**4. 精确的 diff 约束**

> "Never edit unrelated files; keep diffs tightly scoped."
> "Do not add 'Co-Authored-By' or any AI attribution trailers to commit messages."

---

## 案例八：Effect-TS — 约 120 行规则

**文件**: `github.com/Effect-TS/effect/blob/main/AGENTS.md`

### 他们怎么做的

**核心原则（三句话）**

- **Zero Tolerance for Errors**: All automated checks must pass
- **Clarity over Cleverness**: Choose clear, maintainable solutions
- **Reduce comments**: Avoid comments unless absolutely required

**自动化验证步骤（必须按顺序执行）**

1. `pnpm lint-fix` after editing files
2. `pnpm test run <test_file.ts>`
3. `pnpm check`
4. `pnpm build`
5. `pnpm docgen`

**Barrel 文件规则**

> "The `index.ts` files are automatically generated. Do not manually edit them. Use `pnpm codegen` to regenerate."

**测试模式**

> "Use `it.effect` for all Effect-based tests, not `Effect.runSync` with regular `it`. Never use `expect` from vitest in Effect tests — use `assert` methods instead."

---

## 跨项目的共性模式总结

| 模式                          | 哪些项目在用                  |
| ----------------------------- | ----------------------------- |
| 修改代码前必须启动 dev server | Next.js, Qwik, pnpm           |
| 禁止重复运行测试，输出存文件  | Next.js, Elasticsearch        |
| 禁止 AI 署名                  | Next.js, Elasticsearch        |
| 明确的 Do/Don't 清单          | Cal.com, n8n, Qwik            |
| 禁止忽略测试失败              | pnpm, Effect-TS               |
| 注释只写 why 不写 what        | pnpm, Cal.com, Effect-TS      |
| 规则文件本身有维护规则        | Cline                         |
| 架构决策记录（ADR）           | AI SDK                        |
| 变更必须带 changeset          | pnpm, AI SDK, Qwik, SvelteKit |
| AI 操作必须签名               | pnpm                          |
| 安全修复的卫生规则            | n8n                           |
| 禁止通配符 import             | Elasticsearch                 |
| PR 大小限制（<500 行）        | Cal.com                       |
| "拿不准就问人"的分类框架      | Cal.com, AI SDK               |
| 记录已知的 Bug 模式和坑       | Cline, pnpm, Elasticsearch    |
