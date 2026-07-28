# Agent Skills 聚合网站清单

> 记录市面上独立的 Agent Skills 聚合/目录/市场网站，用于 discover 广场的产品参考与竞品对标。
> 更新日期：2026-07-27

## 一、清单总览（按收录规模降序）

| #   | 站点                | 规模                                     | 定位                                          | 链接                                                   |
| --- | ------------------- | ---------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| 1   | SkillsMP            | 233 万+                                  | 全 GitHub 扫 SKILL.md 的「生态地图」          | https://skillsmp.com/zh                                |
| 2   | AgentSkill.sh       | 27.4 万+                                 | 按职业/平台分类 + Quality Score + 安全审计    | https://agentskill.sh/                                 |
| 3   | Claude Marketplaces | 2.34 万 skills + 2.6k 集市 + 1.27 万 MCP | Claude Code 插件/技能/MCP 综合目录（#1 自称） | https://claudemarketplaces.com/                        |
| 4   | ClaudeSkills.info   | 4.28 万                                  | 按安装量/Stars 排名的 Claude 技能目录         | https://claudeskills.info/skills/                      |
| 5   | Skills.sh（Vercel） | 累计安装 100 万+                         | npm 风格 CLI 包管理器 + 目录                  | https://www.skills.sh/                                 |
| 6   | OfficialSkills.sh   | 651（官方）                              | 仅收录 55 个开发团队的官方技能                | https://officialskills.sh/                             |
| 7   | LobeHub Plugins     | 16.9 万+                                 | 深度绑定 LobeHub 自家生态                     | https://lobehub.com/plugins                            |
| 8   | AwesomeSkill.ai     | 未公开                                   | 提供 API + OpenAPI + 发现索引                 | https://awesomeskill.ai/                               |
| 9   | Agensi              | 200+                                     | 精选 + 付费 + 8 项安全扫描 + 创作者 80% 分成  | https://www.agensi.io/                                 |
| 10  | MCPMarket           | ~500                                     | MCP 服务器目录，附带 skills 分区              | https://mcpmarket.com                                  |
| 11  | AiTMPL              | 加载中/未公开                            | Claude Code 模板与 Stack Builder 组合         | https://aitmpl.com/skills/                             |
| 12  | Open Design Skills  | 16                                       | 设计领域专用技能（导出/设计系统/媒体生成）    | https://open-design.ai/zh/plugins/skills/              |
| 13  | SkillHub（腾讯云）  | 未公开                                   | 主打「专为中国用户优化」的 Skills 社区        | https://skillhub.cloud.tencent.com/skills?sortBy=score |

## 二、按定位分三类

### 🗺️ 全量地图派（追量，不挑质量）

- **SkillsMP**（233 万）、**AgentSkill.sh**（27 万）、**ClaudeSkills.info**（4 万）、**LobeHub**（17 万）
- 思路：全 GitHub 扫描 SKILL.md 文件名，堆量卖 API，靠用户自行判断质量。
- 与 discover 路线最接近的竞品。

### 🏪 精选/官方派（量少质优，有信任背书）

- **OfficialSkills.sh**（651，55 个 dev team）、**Agensi**（200+，8 项安全扫描 + 付费分成）
- 思路：人工或半自动筛选，强调安全与质量。
- discover 的 failCount/license/prune 三重过滤天然走这条线，应重点参考。

### 🔧 工具/生态派（绑定特定平台或工作流）

- **Skills.sh**（Vercel CLI）、**MCPMarket**（MCP 生态）、**Claude Marketplaces**（GitHub 集市）、**AiTMPL**（Stack Builder）、**Open Design**（设计专用）
- 思路：不靠内容取胜，靠和某个工具/生态绑定。

## 三、值得重点研究的竞品

### AgentSkill.sh（最全面）

- 27 万量级 + 按职业分类 + Quality Score + 安全审计
- 把「量」和「质」都做了，UI 成熟
- **建议扒**：职业分类体系、Quality Score 算法、安全审计展示方式

### Agensi（商业模式参考）

- 200+ 精选 + 8 项安全扫描 + 创作者 80% 分成 + MCP 实时访问（$9/月）
- 完整的付费闭环
- **建议参考**：安全审计展示、付费/分成模式（若考虑变现）

### OfficialSkills.sh（官方筛选标准）

- 仅 651 个，来自 55 个开发团队（Microsoft/OpenAI/Anthropic/Firebase 等）
- 9 个分类（infrastructure/development/ai-tools/testing/security 等）
- **建议参考**：分类体系、官方收录标准

## 四、对比 discover 广场

| 维度     | SkillsMP    | AgentSkill.sh    | discover（当前）           |
| -------- | ----------- | ---------------- | -------------------------- |
| 数量     | 233 万      | 27 万            | 几百                       |
| 分类     | 职业        | 职业 + 平台      | ❌ 仅搜索                  |
| 质量过滤 | ❌ 用户自判 | ✅ Quality Score | ✅ failCount/license/prune |
| 安全审计 | ❌          | ✅ 标注风险      | ❌                         |
| API 开放 | ✅          | ✅               | ❌                         |
| 付费模式 | ❌          | ❌               | ❌                         |
| 自动同步 | ✅          | ?                | ✅ ETag/sha 增量           |

## 五、可借鉴的产品方向

1. **职业/场景分类入口**（参考 AgentSkill.sh / SkillsMP / OfficialSkills）
   - 当前广场只有搜索，可加按角色（前端/数据/产品）或场景（开发/测试/安全）的分类导航
2. **质量评分展示**（参考 AgentSkill.sh 的 Quality Score）
   - 可基于 stars/活跃度/license 完整度计算简易评分
3. **安全/合规标注**（参考 Agensi 的安全审计）
   - 至少标注 license 状态、最近更新时间、是否官方
4. **开放 API**（参考 SkillsMP / AgentSkill.sh）
   - 让别人能在自己的 agent 工作流里调用广场数据，做分发
5. **CLI 安装**（参考 Skills.sh 的 `npx skillsadd`）
   - 降低安装门槛，从「网页挑」延伸到「终端装」

## 六、已排除的非目录站点

| 站点                                                               | 原因                                 |
| ------------------------------------------------------------------ | ------------------------------------ |
| https://lobehub.com/task                                           | 是 AI 任务管理平台，不是 skills 目录 |
| https://agentskills.io/client-implementation/adding-skills-support | 是 Agent Skills 规范文档，不是目录站 |

## 七、GitHub awesome 聚合源（discover 数据源）

> discover 广场的 `AWESOME_SOURCES` 配置项，配置文件：`src/server/domain/discover/skills/constants/sources.ts`。
> 来源：通过 GitHub API 搜索 + 多轮筛选，从 119 个候选仓库中精选的「README 列出其他 SKILL.md 仓库链接」的聚合型列表。
> 排除标准：MCP servers 列表、纯教程/文档、fork/翻译版、星标过低（<50）。
> 同步机制：每日凌晨 4 点 scan 任务读这些源的 README，正则抽取其中的 `github.com/owner/repo` 链接登记为子货源，fan-out sync-repo 逐个抓取。

### 第一梯队（已启用）

高 star + 明确聚合型，单源覆盖上千 skills。链接均经 GitHub API 实测验证真实存在。

| 仓库                                      | Stars | 定位                                                        | 链接                                                       |
| ----------------------------------------- | ----- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| `VoltAgent/awesome-agent-skills`          | 29k   | 1000+ 跨平台 skills（Claude/Codex/Gemini/Cursor），质量最高 | https://github.com/VoltAgent/awesome-agent-skills          |
| `ComposioHQ/awesome-claude-skills`        | 71k   | Claude 专用 curated list，覆盖最广                          | https://github.com/ComposioHQ/awesome-claude-skills        |
| `VoltAgent/awesome-openclaw-skills`       | 51k   | 5400+ skills 经筛选分类                                     | https://github.com/VoltAgent/awesome-openclaw-skills       |
| `sickn33/agentic-awesome-skills`          | 44k   | AAS Core，catalog discovery + 本地注册表                    | https://github.com/sickn33/agentic-awesome-skills          |
| `composio-community/awesome-codex-skills` | 15k   | Codex CLI/API 实用 skills                                   | https://github.com/composio-community/awesome-codex-skills |
| `travisvn/awesome-claude-skills`          | 14k   | Claude Code 专用 curated list                               | https://github.com/travisvn/awesome-claude-skills          |

### 第二梯队（已注释，按需启用）

中等 star / 垂直领域 / 中文精选。启用前请权衡：每加一个源，凌晨同步任务量显著增加，建议先观察第一梯队的配额消耗（GitHub API 认证后 5000/h）再决定。链接均经 GitHub API 实测验证真实存在。

| 仓库                                     | Stars | 定位                                     | 链接                                                      |
| ---------------------------------------- | ----- | ---------------------------------------- | --------------------------------------------------------- |
| `BehiSecc/awesome-claude-skills`         | 9.8k  | 含 SkillCheck SKILL.md 验证器            | https://github.com/BehiSecc/awesome-claude-skills         |
| `heilcheng/awesome-agent-skills`         | 6k    | tutorials + directory                    | https://github.com/heilcheng/awesome-agent-skills         |
| `libukai/awesome-agent-skills`           | 4.9k  | 中文，Agent Skills 终极指南              | https://github.com/libukai/awesome-agent-skills           |
| `bergside/awesome-design-skills`         | 2k    | 设计领域专用（67 个 DESIGN.md/SKILL.md） | https://github.com/bergside/awesome-design-skills         |
| `skillmatic-ai/awesome-agent-skills`     | 643   | 元目录，跟踪多平台支持情况               | https://github.com/skillmatic-ai/awesome-agent-skills     |
| `JackyST0/awesome-agent-skills`          | 605   | 中文精选，适用 Cursor/Claude/Copilot     | https://github.com/JackyST0/awesome-agent-skills          |
| `spencerpauly/awesome-cursor-skills`     | 622   | Cursor 专用                              | https://github.com/spencerpauly/awesome-cursor-skills     |
| `helloianneo/awesome-claude-code-skills` | 390   | 中文场景分类，带推荐等级                 | https://github.com/helloianneo/awesome-claude-code-skills |

### 筛选时排除的类型（避免污染数据源）

- **MCP servers 列表**：`punkpeye/awesome-mcp-servers`（9 万星）等——是 MCP 服务器，不是 skills
- **教程/文档/知识库**：`awesome-openclaw-usecases` / `tips` / `tutorial` / `research` / Obsidian 笔记库
- **翻译版**：`*-zh` / `*-cn` / `*-zh-TW`——和原版重复，会被 `skipDuplicates` 去重但浪费配额
- **批量 fork**：命名含 `r07-` / `r08-` / `r09-` / `r17-` 前缀的衍生仓库
- **星标过低**（<50）：质量存疑，维护不可靠

### 扩源方法

新增源只需在 `src/server/domain/discover/skills/constants/sources.ts` 的 `AWESOME_SOURCES` 数组里加一行仓库全名（`owner/repo`）。下次凌晨 scan 任务会自动读取该仓库 README、抽取链接、登记子货源并 fan-out 同步。重复仓库由 `skipDuplicates` 自动跳过。
