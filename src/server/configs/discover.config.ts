// # Discover 广场同步配置

/**
 * 每日同步的 awesome 货源目录清单（skills 资源类型），加新源就是加一行。
 *
 * 货源来源：通过 GitHub API 搜索 + 多轮筛选，从 119 个候选仓库中精选的「README 列出其他 SKILL.md 仓库链接」的聚合型列表。
 * 排除标准：MCP servers 列表、纯教程/文档、fork/翻译版、星标过低（<50）。
 *
 * 启用前请权衡：每加一个源，凌晨同步任务会 fan-out 出几十到几千个 sync-repo 任务，消耗 GitHub API 配额（认证后 5000/h）。
 * 默认只启用第一梯队（高 star + 明确聚合型），第二梯队按需取消注释启用。
 */
export const AWESOME_SOURCES = [
	// @ 第一梯队：高 star + 明确聚合型，单源覆盖上千 skills
	"VoltAgent/awesome-agent-skills", // 29k｜1000+ 跨平台 skills（Claude/Codex/Gemini/Cursor），质量最高
	"ComposioHQ/awesome-claude-skills", // 71k｜Claude 专用 curated list，覆盖最广
	"VoltAgent/awesome-openclaw-skills", // 51k｜5400+ skills 经筛选分类
	"sickn33/agentic-awesome-skills", // 44k｜AAS Core，catalog discovery + 本地注册表
	"composio-community/awesome-codex-skills", // 15k｜Codex CLI/API 实用 skills
	"travisvn/awesome-claude-skills", // 14k｜Claude Code 专用 curated list

	// @ 第二梯队：中等 star / 垂直领域 / 中文精选，按需取消注释启用
	// 注意：启用后同步任务量显著增加，建议先观察第一梯队的配额消耗再决定
	// "BehiSecc/awesome-claude-skills", // 9.8k｜含 SkillCheck SKILL.md 验证器
	// "heilcheng/awesome-agent-skills", // 6k｜tutorials + directory
	// "libukai/awesome-agent-skills", // 4.9k｜中文，Agent Skills 终极指南
	// "bergside/awesome-design-skills", // 2k｜设计领域专用（67 个 DESIGN.md/SKILL.md）
	// "skillmatic-ai/awesome-agent-skills", // 643｜元目录，跟踪多平台支持情况
	// "JackyST0/awesome-agent-skills", // 605｜中文精选，适用 Cursor/Claude/Copilot
	// "spencerpauly/awesome-cursor-skills", // 622｜Cursor 专用
	// "helloianneo/awesome-claude-code-skills", // 390｜中文场景分类，带推荐等级
] as const;

// 连续失败达到该次数的货源置 dormant（休眠后每周试探，成功自动复活）
export const SOURCE_FAIL_THRESHOLD = 5;
