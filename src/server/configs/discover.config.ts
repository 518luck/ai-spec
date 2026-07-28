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

// 广场每日扫描的 cron 表达式（BullMQ 调度，默认按 UTC 时区）
// 本地测试可设 DISCOVER_SCAN_CRON="*/1 * * * *"（每分钟触发）；生产留空走默认 04:00
export const DISCOVER_SCAN_CRON = process.env.DISCOVER_SCAN_CRON || "0 4 * * *";

/**
 * 广场前端可见的 license 白名单（SPDX id）。
 *
 * 口径：免费目录站「元数据索引」——可展示 name / description，并附 license 与来源回链；
 * 不表示用户可把 SKILL 全文闭源商用拷贝进自有项目。抓取入库仍可保留更广协议，仅读接口按此过滤。
 *
 * 组成：
 * 1. 宽松协议（Blue Oak Bronze+ / GitHub 高频优先，再补常见变体）
 * 2. 内容向 CC-BY / CC0 / CC-BY-SA（不含 NC / ND）
 * 3. 弱/强 copyleft（MPL/EPL/LGPL/GPL/AGPL 等；目录索引场景可展示）
 * 另：license 为空（无协议）由查询侧单独放行，同样展示 description +「无协议」标记 + 回链。
 *
 * 明确不进：CC-BY-NC*、BUSL、SSPL、Elastic、FSL 等非商用或源可用限制协议。
 */
export const DISCOVER_FRONTEND_LICENSE_ALLOWLIST = [
	// @ 1a GitHub 高频宽松
	"0BSD",
	"AFL-3.0",
	"Apache-1.0",
	"Apache-1.1",
	"Apache-2.0",
	"Artistic-2.0",
	"BlueOak-1.0.0",
	"BSD-1-Clause",
	"BSD-2-Clause",
	"BSD-2-Clause-Patent",
	"BSD-3-Clause",
	"BSD-3-Clause-Clear",
	"BSD-4-Clause",
	"BSL-1.0",
	"CC0-1.0",
	"ECL-2.0",
	"ISC",
	"MIT",
	"MIT-0",
	"MS-PL",
	"MulanPSL-1.0",
	"MulanPSL-2.0",
	"NCSA",
	"PHP-3.0",
	"PHP-3.01",
	"PostgreSQL",
	"PSF-2.0",
	"Python-2.0",
	"Ruby",
	"Unlicense",
	"UPL-1.0",
	"WTFPL",
	"Zlib",

	// @ 1b 宽松常见变体（Blue Oak Bronze+ / 生态常见）
	"AFL-1.1",
	"AFL-1.2",
	"AFL-2.0",
	"AFL-2.1",
	"BSD-2-Clause-Views",
	"BSD-3-Clause-Attribution",
	"BSD-3-Clause-LBNL",
	"BSD-3-Clause-Open-MPI",
	"BSD-4-Clause-UC",
	"curl",
	"ECL-1.0",
	"EFL-2.0",
	"Fair",
	"FSFAP",
	"FSFUL",
	"FSFULLR",
	"FTL",
	"GLWTPL",
	"HPND",
	"HTMLTIDY",
	"ICU",
	"IJG",
	"ImageMagick",
	"Intel",
	"Jam",
	"Libpng",
	"libpng-2.0",
	"Linux-OpenIB",
	"MirOS",
	"MIT-Modern-Variant",
	"Multics",
	"Naumen",
	"NTP",
	"OLDAP-2.8",
	"OpenSSL",
	"SMLNJ",
	"TCL",
	"Unicode-3.0",
	"Unicode-DFS-2015",
	"Unicode-DFS-2016",
	"W3C",
	"W3C-20150513",
	"X11",
	"Xnet",
	"ZPL-1.1",
	"ZPL-2.0",
	"ZPL-2.1",
	"blessing",
	"Beerware",

	// @ 2 内容向 CC（可商用展示；不含 NC/ND）
	"CC-BY-1.0",
	"CC-BY-2.0",
	"CC-BY-2.5",
	"CC-BY-3.0",
	"CC-BY-3.0-US",
	"CC-BY-4.0",
	"CC-BY-SA-2.0",
	"CC-BY-SA-2.5",
	"CC-BY-SA-3.0",
	"CC-BY-SA-4.0",
	"CC-PDDC",

	// @ 3 弱 copyleft（目录可展示 name/description + 回链）
	"MPL-1.1",
	"MPL-2.0",
	"MPL-2.0-no-copyleft-exception",
	"EPL-1.0",
	"EPL-2.0",
	"CDDL-1.0",
	"CDDL-1.1",
	"CPL-1.0",
	"IPL-1.0",
	"MS-RL",
	"EUPL-1.1",
	"EUPL-1.2",
	"LGPL-2.0",
	"LGPL-2.0-only",
	"LGPL-2.0-or-later",
	"LGPL-2.1",
	"LGPL-2.1-only",
	"LGPL-2.1-or-later",
	"LGPL-3.0",
	"LGPL-3.0-only",
	"LGPL-3.0-or-later",

	// @ 4 强 copyleft（同上；GitHub 旧 id 与 SPDX only/or-later 都收录）
	"GPL-2.0",
	"GPL-2.0-only",
	"GPL-2.0-or-later",
	"GPL-3.0",
	"GPL-3.0-only",
	"GPL-3.0-or-later",
	"AGPL-3.0",
	"AGPL-3.0-only",
	"AGPL-3.0-or-later",
	"OSL-2.1",
	"OSL-3.0",
	"CECILL-2.1",
] as const;
