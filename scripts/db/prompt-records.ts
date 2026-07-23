import "dotenv/config";

import prisma from "@/shared/db";
import { calculateDiff, serializeDiff } from "@/shared/lib/diff";

// 模拟当前用户（luck2 zhang / zhangluck598@gmail.com）在数据库中的 ID
const OWNER_ID = "cmrjdu92f0001099de7h2zu5p";

// 普通收录生成数量
const NORMAL_RECORD_COUNT = 150;

// 超多版本测试的版本数（跨过 v1/v10/v20/.../v100 共 11 个快照锚点）
const MULTI_VERSION_COUNT = 100;

// @ 普通收录模板，按业务主题分组，复用草稿侧的正式段落内容以保持风格一致
const recordTemplates = [
	{
		name: "API 接口规范",
		content: [
			"本接口遵循 RESTful 设计原则，统一返回 JSON 格式。",
			"请求头必须包含 Content-Type: application/json。",
			"鉴权使用 Bearer Token，Token 有效期为 2 小时。",
			"分页参数统一为 page 和 pageSize，默认 pageSize=20。",
			"错误码采用三段式：业务模块（2位）+ 错误类型（2位）+ 序号（2位）。",
			"所有创建接口需返回 201，幂等接口返回 200。",
			"敏感字段禁止在日志中明文输出。",
		].join("\n"),
	},
	{
		name: "数据库设计文档",
		content: [
			"核心表包含用户表、订单表、商品表和日志表。",
			"主键统一使用 CUID，避免自增 ID 带来的数据泄露风险。",
			"创建时间和更新时间字段均使用 datetime 类型并设置默认当前时间。",
			"软删除使用 deleted_at 字段，查询时默认过滤已删除记录。",
			"索引优先覆盖高频查询条件，避免全表扫描。",
			"金额字段使用 decimal(19,4) 保证精度。",
			"外键关系在应用层维护，数据库层面不强制外键约束。",
		].join("\n"),
	},
	{
		name: "部署上线手册",
		content: [
			"上线前需完成代码评审、测试通过和变更审批。",
			"使用蓝绿部署策略，确保零停机发布。",
			"部署脚本需预先在 staging 环境验证。",
			"上线后观察 15 分钟核心指标，包括错误率、响应时间和吞吐量。",
			"如遇异常立即切换回旧版本并通知值班人员。",
			"回滚操作必须在 5 分钟内完成。",
			"上线完成后在群聊中同步版本号和变更摘要。",
		].join("\n"),
	},
	{
		name: "周会会议纪要",
		content: [
			"本周完成用户注册流程优化和登录鉴权升级。",
			"下周重点推进支付模块重构和订单查询性能优化。",
			"阻塞问题：第三方支付接口文档版本不一致，需商务跟进。",
			"会议决议：每日站会改为上午 10 点，超过 15 分钟的问题单独拉会。",
			"Action Item 已分配给各负责人，截止日期为下周五。",
			"风险提醒：节假日期间值班人员需提前确认。",
			"下次会议预定在下周三下午 2 点。",
		].join("\n"),
	},
	{
		name: "需求评审记录",
		content: [
			"本次评审覆盖购物车、优惠券和结算页三个模块。",
			"产品确认优惠券支持满减、折扣和免邮三种类型。",
			"技术反馈结算页需要新增金额计算服务，预计 3 人日。",
			"设计侧需在本周五前提供优惠券领取流程的交互稿。",
			"待确认问题：是否支持跨店铺凑单使用优惠券。",
			"评审结论：通过，进入开发排期。",
			"后续由产品经理补充边界场景和异常提示文案。",
		].join("\n"),
	},
	{
		name: "用户故事清单",
		content: [
			"作为用户，我希望通过手机号快速注册，以便节省时间。",
			"作为用户，我希望查看订单物流轨迹，以便掌握配送进度。",
			"作为商家，我希望批量导出商品信息，以便进行线下盘点。",
			"作为运营，我希望配置限时秒杀活动，以便提升转化率。",
			"作为客服，我希望查看用户历史工单，以便快速定位问题。",
			"作为管理员，我希望审计关键操作日志，以便满足合规要求。",
			"所有故事需包含验收标准和估算工时。",
		].join("\n"),
	},
	{
		name: "代码审查规范",
		content: [
			"提交 PR 前必须本地运行测试并确保全部通过。",
			"每个 PR 需至少一名核心成员审批。",
			"变更范围应聚焦，单 PR 不宜超过 400 行有效代码。",
			"审查重点关注：业务逻辑正确性、边界处理、安全风险和性能影响。",
			"命名需清晰表达意图，避免无意义缩写。",
			"禁止引入未使用的依赖和变量。",
			"合并前需 Squash 并填写清晰的提交信息。",
		].join("\n"),
	},
	{
		name: "Git 工作流指南",
		content: [
			"主分支为 main，所有功能通过 feature 分支开发。",
			"分支命名格式：feature/功能简述、fix/bug 编号、hotfix/问题描述。",
			"提交信息前缀：feat、fix、docs、style、refactor、test、chore。",
			"合并前需 rebase 到 main 分支并解决冲突。",
			"发布版本使用 tag 标记，格式为 v 主版本.次版本.修订号。",
			"hotfix 需从 main 切出，修复后同时合并回 develop。",
			"定期清理已合并的远程分支。",
		].join("\n"),
	},
	{
		name: "测试用例设计",
		content: [
			"测试用例需覆盖正常流程、异常流程和边界条件。",
			"输入校验包括空值、超长字符串、特殊字符和非法格式。",
			"权限测试需验证未授权、越权和角色切换场景。",
			"性能测试关注并发下的响应时间和资源占用。",
			"UI 测试使用自动化工具覆盖核心用户路径。",
			"回归测试在每次发版前执行，确保历史功能稳定。",
			"用例需保持独立，避免前后依赖导致执行失败。",
		].join("\n"),
	},
	{
		name: "UI 设计规范",
		content: [
			"设计系统采用 8px 网格基线，保证元素对齐一致。",
			"主色调为品牌蓝，辅助色用于成功、警告和错误状态。",
			"字体使用系统默认无衬线字体，正文 14px，标题逐级递增。",
			"按钮高度统一为 32px 和 40px 两种规格。",
			"表单输入框需包含聚焦状态和错误提示样式。",
			"图标使用线性风格，保持 1.5px 描边。",
			"暗色模式需单独定义色板，确保对比度符合无障碍标准。",
		].join("\n"),
	},
	{
		name: "性能优化方案",
		content: [
			"首屏加载时间目标控制在 1.5 秒以内。",
			"静态资源启用 CDN 和长期缓存策略。",
			"图片使用 WebP 格式并按视口大小裁剪。",
			"接口响应超过 500ms 的需纳入优化清单。",
			"数据库慢查询需添加索引或改写 SQL。",
			"前端使用虚拟滚动处理长列表，避免一次性渲染大量 DOM。",
			"监控接入 RUM 和 APM，持续跟踪性能指标。",
		].join("\n"),
	},
	{
		name: "故障排查手册",
		content: [
			"服务不可用首先检查健康检查接口和容器状态。",
			"数据库连接池耗尽时，检查慢查询和连接泄露。",
			"接口超时需确认下游依赖是否异常或网络抖动。",
			"内存溢出时导出堆快照并分析大对象引用链。",
			"消息队列堆积需检查消费端处理速度和重试策略。",
			"日志中关键字段需包含 traceId，便于链路追踪。",
			"重大故障需在 30 分钟内完成初步通报和止损。",
		].join("\n"),
	},
	{
		name: "数据埋点规范",
		content: [
			"埋点事件需包含事件名、触发时机和业务属性。",
			"事件命名采用小写驼峰，模块前缀加动作名。",
			"通用属性包括平台、版本、用户标识和发生时间。",
			"敏感信息禁止作为埋点属性上报。",
			"埋点需经过产品和技术双方评审后上线。",
			"抽样策略仅在流量分析场景下使用，事件总量需可预估。",
			"埋点变更需同步更新文档并通知数据团队。",
		].join("\n"),
	},
	{
		name: "产品更新日志",
		content: [
			"本期新增购物车批量编辑和优惠券叠加功能。",
			"优化订单详情页加载速度，平均耗时降低 40%。",
			"修复部分机型下支付按钮无法点击的问题。",
			"调整个人中心菜单结构，提升功能查找效率。",
			"后台管理新增数据导出权限控制。",
			"已知问题：低版本浏览器下部分动画表现不一致。",
			"建议用户升级至最新版本以获得完整体验。",
		].join("\n"),
	},
	{
		name: "运维操作手册",
		content: [
			"每日晨检查看核心服务告警和日志异常。",
			"例行备份策略为每日凌晨 2 点全量备份数据库。",
			"配置变更需通过 Git 版本控制并经过双人复核。",
			"服务器补丁更新在测试环境验证后再上生产。",
			"证书到期前 30 天开始续期流程，避免服务中断。",
			"故障演练每季度进行一次，检验应急预案有效性。",
			"操作记录需保留审计日志，便于事后追溯。",
		].join("\n"),
	},
	{
		name: "安全审计报告",
		content: [
			"本次审计覆盖 Web 应用、API 接口和数据库访问。",
			"发现高危漏洞 1 个：部分接口未做鉴权校验。",
			"中危漏洞 3 个：包括日志敏感信息泄露、越权访问和缺乏速率限制。",
			"低危问题 5 个：主要是错误提示过于详细和响应头缺失。",
			"建议两周内完成高危和中危漏洞修复。",
			"后续需引入自动化安全扫描并纳入 CI。",
			"修复完成后进行复测，确认漏洞已关闭。",
		].join("\n"),
	},
	{
		name: "架构设计文档",
		content: [
			"系统采用微服务架构，按业务领域划分服务边界。",
			"网关层负责鉴权、限流和路由转发。",
			"服务间通信优先使用 gRPC，对外暴露 REST API。",
			"缓存采用 Redis 集群，存储热点数据和会话信息。",
			"消息队列用于削峰填谷和解耦异步流程。",
			"数据库按业务分库分表，核心表每日备份。",
			"监控体系包括日志、指标和链路追踪三大支柱。",
		].join("\n"),
	},
	{
		name: "团队培训笔记",
		content: [
			"本次培训主题为 TypeScript 高级类型和最佳实践。",
			"重点讲解了泛型、条件类型和类型推断的使用场景。",
			"通过案例演示了如何减少 any 并提升类型安全。",
			"讨论了 React 中 children 类型和 forwardRef 的类型声明。",
			"培训后安排了一次小练习，巩固所学内容。",
			"建议团队成员将旧代码中的类型断言逐步替换为更安全的写法。",
			"下次培训将聚焦性能调优和测试策略。",
		].join("\n"),
	},
	{
		name: "项目复盘总结",
		content: [
			"本次迭代按时交付，但测试阶段暴露问题较多。",
			"需求变更在迭代中期集中出现，导致开发计划被打乱。",
			"改进措施：需求冻结期内严格控制变更，提前识别风险。",
			"团队沟通效率有待提升，跨组协作信息同步不及时。",
			"自动化测试覆盖率不足，回归耗时较长。",
			"亮点：前端组件复用率提升，开发效率有所提高。",
			"下一步将引入迭代回顾会议，持续优化流程。",
		].join("\n"),
	},
	{
		name: "客户反馈整理",
		content: [
			"近一周收到客户反馈 42 条，主要集中在支付和物流体验。",
			"支付失败反馈 8 条，原因多为银行限额和验证码超时。",
			"物流更新不及时反馈 12 条，需同步第三方推送频率。",
			"页面加载慢反馈 5 条，已纳入性能优化排期。",
			"客服响应速度得到正面评价 15 条。",
			"建议增加订单状态变更的主动通知渠道。",
			"下周产品将针对高频问题制定优化方案。",
		].join("\n"),
	},
];

// 返回 [min, max] 闭区间内的随机整数
const randomInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

// > 生成单条普通收录数据：copyCount + lastCopiedAt 共同驱动 HN 幅律热度排序
// id 不在脚本侧生成，由数据库 schema 的 @default(cuid()) 保证唯一，避免自制 id 发生碰撞
const generateRecord = (
	index: number,
): {
	name: string;
	content: string;
	images: string[];
	visibility: "private";
	teamId: null;
	copyCount: number;
	lastCopiedAt: Date | null;
	ownerId: string;
	contributedBy: null;
	lastEditorId: null;
	folderId: null;
	createdAt: Date;
	updatedAt: Date;
} => {
	const template = recordTemplates[index % recordTemplates.length];
	const serial = Math.floor(index / recordTemplates.length) + 1;
	const baseDate = new Date(2026, 6, 10, 9, 0, 0, 0);
	const createdAt = new Date(baseDate.getTime() + index * 7 * 60 * 1000);
	const updatedAt = new Date(createdAt.getTime() + randomInt(0, 60) * 1000);

	// copyCount 为 0 时 lastCopiedAt 为 null（从未复制过）；否则随机分布在最近 30 天内
	const copyCount = randomInt(0, 50);
	const lastCopiedAt =
		copyCount === 0 ? null : new Date(Date.now() - randomInt(0, 30 * 24 * 60) * 60 * 1000);

	return {
		name: `${template.name}-${serial}`,
		content: template.content,
		images: [],
		visibility: "private",
		teamId: null,
		copyCount,
		lastCopiedAt,
		ownerId: OWNER_ID,
		contributedBy: null,
		lastEditorId: null,
		folderId: null,
		createdAt,
		updatedAt,
	};
};

// @ 特殊测试收录数据构造

// > 超长名称：正好 64 字符（name schema 上限），测试卡片/标题栏截断
const LONG_NAME =
	"前端工程化最佳实践与性能优化完全指南涵盖模块化构建打包代码分割懒加载按需加载".slice(0, 64);

// > 超大文本：约 5 万字符，重复 Markdown 段落，测试渲染性能与复制全文
const buildLargeContent = (): string => {
	const section = [
		"## 章节标题",
		"",
		"这是一段用于压力测试的正文内容。包含较长的描述性文字，",
		"目的是测试前端 Markdown 渲染组件在大文本场景下的性能表现，",
		"以及复制全文功能在超长内容时的响应速度。",
		"",
		"- 列表项一：核心模块加载策略",
		"- 列表项二：按需引入与 Tree Shaking",
		"- 列表项三：运行时性能监控指标",
		"",
		"> 引用块：性能优化的核心在于测量而非猜测，先建立基线再逐项优化。",
		"",
		"| 指标 | 目标值 | 当前值 | 状态 |",
		"| --- | --- | --- | --- |",
		"| 首屏 | 1.5s | 1.2s | ✅ |",
		"| 交互 | 200ms | 180ms | ✅ |",
		"| 包体 | 200KB | 240KB | ❌ |",
		"",
		"",
	].join("\n");
	// 约 500 字/段，重复 100 次约 5 万字符
	return Array.from({ length: 100 }, (_, i) => `### 第 ${i + 1} 段\n${section}`).join("\n");
};

// > 代码块富文本：多语言代码块 + 行内代码 + 嵌套列表，测试语法高亮
const CODE_RICH_CONTENT = [
	"# 代码块渲染测试",
	"",
	"本文档包含多种语言的代码块，用于测试 `react-markdown` + `rehype-highlight` 的语法高亮。",
	"",
	"## JavaScript",
	"",
	"```javascript",
	"// 异步获取用户数据并处理错误",
	"async function fetchUser(id) {",
	"  try {",
	"    const res = await fetch(`/api/users/${id}`);",
	"    if (!res.ok) throw new Error(`HTTP ${res.status}`);",
	"    const data = await res.json();",
	"    return data;",
	"  } catch (err) {",
	"    console.error('获取用户失败:', err.message);",
	"    return null;",
	"  }",
	"}",
	"```",
	"",
	"## Python",
	"",
	"```python",
	"# 列表推导式与生成器表达式对比",
	"def process_items(items):",
	"    # 列表推导式：立即生成全部",
	"    squares = [x ** 2 for x in items if x > 0]",
	"    # 生成器表达式：惰性求值",
	"    squares_gen = (x ** 2 for x in items if x > 0)",
	"    return squares, list(squares_gen)",
	"```",
	"",
	"## SQL",
	"",
	"```sql",
	"-- 查询每个分类下销量前三的商品",
	"SELECT category_id, product_name, sales_count",
	"FROM (",
	"    SELECT category_id, product_name, sales_count,",
	"           ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY sales_count DESC) AS rn",
	"    FROM products",
	") ranked",
	"WHERE rn <= 3",
	"ORDER BY category_id, rn;",
	"```",
	"",
	"## Bash",
	"",
	"```bash",
	"#!/bin/bash",
	"# 批量重命名当前目录下的 .jpeg 文件为 .jpg",
	"for file in *.jpeg; do",
	'    if [ -f "$file" ]; then',
	'        mv "$file" "${file%.jpeg}.jpg"',
	"    fi",
	"done",
	"echo 'Done'",
	"```",
	"",
	"## JSON",
	"",
	"```json",
	"{",
	'  "name": "ai-spec",',
	'  "version": "1.0.0",',
	'  "scripts": {',
	'    "dev": "next dev",',
	'    "build": "next build"',
	"  },",
	'  "dependencies": {',
	'    "next": "^15.0.0",',
	'    "react": "^19.0.0"',
	"  }",
	"}",
	"```",
	"",
	"## 行内代码与嵌套列表",
	"",
	"使用 `useEffect` 时注意依赖数组，避免无限重渲染。常见场景：",
	"",
	"1. 基础用法",
	"   - 依赖项为空数组 `[]`：仅挂载时执行一次",
	"   - 依赖项含状态：状态变化时重新执行",
	"2. 清理函数",
	"   - 返回的函数在组件卸载或下次 effect 执行前调用",
	"   - 常用于取消订阅、清除定时器",
	"",
	"更多细节参考 [React 官方文档](https://react.dev)。",
].join("\n");

// > 超多版本收录的基础内容：v1 起始正文
const MULTI_VERSION_BASE_CONTENT = [
	"# 版本历史压力测试",
	"",
	"本收录用于测试版本列表的滚动加载、diff 重建和快照锚点机制。",
	"",
	"## 初始内容（v1）",
	"",
	"这是第一版的内容，作为后续版本 diff 的基准。",
	"- 项目背景说明",
	"- 核心功能列表",
	"- 验收标准定义",
].join("\n");

// > 版本内容微调：模拟真实编辑，每次追加一行修订记录，制造可追踪的 diff
const mutateContent = (content: string, version: number): string => {
	const edits = [
		`- [v${version}] 补充了异常处理流程`,
		`- [v${version}] 新增性能基准数据`,
		`- [v${version}] 修正了术语表述`,
		`- [v${version}] 增加了架构示意图说明`,
		`- [v${version}] 完善了安全注意事项`,
	];
	return `${content}\n${edits[version % edits.length]}`;
};

// > 构造超多版本收录：v1 强制快照，之后每 10 版存快照，其余存增量 diff
// 直接复用项目的 calculateDiff/serializeDiff，保证与真实保存接口生成的 diff 格式一致
const buildMultiVersionData = (ownerId: string, baseTimestamp: Date) => {
	let currentContent = MULTI_VERSION_BASE_CONTENT;
	const versions: {
		editorId: string;
		versionNumber: number;
		message: string;
		isSnapshot: boolean;
		snapshot: string | null;
		diff: string | null;
		createdAt: Date;
	}[] = [];

	for (let v = 1; v <= MULTI_VERSION_COUNT; v++) {
		// v1 强制快照；之后每 10 版（v10、v20）存一次完整快照锚点
		const isSnapshot = v === 1 || v % 10 === 0;
		const prevContent = currentContent;

		// v>=2 时微调内容，制造与前版本的差异
		if (v >= 2) {
			currentContent = mutateContent(currentContent, v);
		}

		versions.push({
			editorId: ownerId,
			versionNumber: v,
			message: `第 ${v} 版${isSnapshot ? "（快照锚点）" : ""}`,
			isSnapshot,
			snapshot: isSnapshot ? currentContent : null,
			// 增量版用项目 diff 工具计算与上一版的差异
			diff: isSnapshot
				? null
				: serializeDiff(calculateDiff({ oldText: prevContent, newText: currentContent })),
			createdAt: new Date(baseTimestamp.getTime() + v * 60 * 1000),
		});
	}

	return { content: currentContent, versions };
};

// @ 特殊测试收录定义：前置 4 条边界用例，各自带 v1 版本记录
const buildSpecialRecords = (ownerId: string) => {
	const baseDate = new Date(2026, 6, 1, 9, 0, 0, 0);
	const largeContent = buildLargeContent();
	const multiVersion = buildMultiVersionData(ownerId, baseDate);

	return [
		// ① 超长名称：64 字符极限，测试卡片与标题栏截断
		{
			record: {
				name: LONG_NAME,
				content: "测试超长名称在列表卡片、详情标题栏和版本页的截断表现。",
				createdAt: new Date(baseDate.getTime() + 0 * 60 * 1000),
			},
			versionContent: "测试超长名称在列表卡片、详情标题栏和版本页的截断表现。",
			versionMessage: "初始版本",
		},
		// ② 超大文本：约 5 万字符，测试 Markdown 渲染性能与复制全文
		{
			record: {
				name: "超大文本压力测试",
				content: largeContent,
				createdAt: new Date(baseDate.getTime() + 1 * 60 * 1000),
			},
			versionContent: largeContent,
			versionMessage: "初始版本",
		},
		// ③ 代码块富文本：多语言代码块 + 行内代码 + 嵌套列表，测试语法高亮
		{
			record: {
				name: "代码块渲染测试",
				content: CODE_RICH_CONTENT,
				createdAt: new Date(baseDate.getTime() + 2 * 60 * 1000),
			},
			versionContent: CODE_RICH_CONTENT,
			versionMessage: "初始版本",
		},
		// ④ 超多版本：100 版本，v1/v10/v20/.../v100 为快照，其余增量 diff
		{
			record: {
				name: "版本历史压力测试",
				content: multiVersion.content,
				createdAt: new Date(baseDate.getTime() + 3 * 60 * 1000),
			},
			versionContent: null,
			versionMessage: null,
			customVersions: multiVersion.versions,
		},
	];
};

// > 写入特殊测试收录：逐条 create，嵌套 versions + favoritedBy 关联创建
// 同时把每条特殊收录加入个人收藏，方便在收藏列表直接定位
const writeSpecialRecords = async (
	ownerId: string,
): Promise<{ versions: number; favorites: number }> => {
	const specials = buildSpecialRecords(ownerId);
	let totalVersions = 0;

	for (const item of specials) {
		// customVersions 存在时用自定义版本数组（超多版本用例），否则建单个 v1 快照
		const versions = item.customVersions ?? [
			{
				editorId: ownerId,
				versionNumber: 1,
				message: item.versionMessage,
				isSnapshot: true,
				snapshot: item.versionContent,
				diff: null,
				createdAt: new Date(item.record.createdAt.getTime() + 1000),
			},
		];

		await prisma.promptRecord.create({
			data: {
				name: item.record.name,
				content: item.record.content,
				images: [],
				visibility: "private",
				teamId: null,
				copyCount: randomInt(0, 50),
				lastCopiedAt: null,
				ownerId,
				contributedBy: null,
				lastEditorId: null,
				folderId: null,
				createdAt: item.record.createdAt,
				updatedAt: item.record.createdAt,
				versions: { create: versions },
				// 个人空间收藏：teamMemberId 为 null 表示纯个人身份收藏
				favoritedBy: {
					create: { userId: ownerId, teamMemberId: null },
				},
			},
		});
		totalVersions += versions.length;
	}

	return { versions: totalVersions, favorites: specials.length };
};

// > 写入普通收录：先 createMany 写收录，再查回数据库生成的 id，批量补建各自的 v1 快照版本
const writeNormalRecords = async (ownerId: string): Promise<number> => {
	const records = Array.from({ length: NORMAL_RECORD_COUNT }, (_, index) => generateRecord(index));

	// 1. 批量写入收录主记录（id 由数据库 @default(cuid()) 生成，避免脚本侧自制 id 碰撞）
	await prisma.promptRecord.createMany({ data: records });

	// 2. 查回刚写入的收录（按创建时间正序，与生成顺序一致），用真实 id 建 v1 快照版本
	const created = await prisma.promptRecord.findMany({
		where: { ownerId, createdAt: { gte: records[0].createdAt } },
		orderBy: { createdAt: "asc" },
		select: { id: true, content: true, createdAt: true },
	});

	const versionRecords = created.map((record) => ({
		// 版本记录 id 同样交由数据库生成，不传
		recordId: record.id,
		editorId: ownerId,
		versionNumber: 1,
		message: "初始版本",
		isSnapshot: true,
		snapshot: record.content,
		diff: null,
		createdAt: new Date(record.createdAt.getTime() + 1000),
	}));

	await prisma.promptRecordVersion.createMany({ data: versionRecords });
	return versionRecords.length;
};

// 主流程：先清空当前用户个人空间内的全部收录（级联删版本和收藏），再依次写入特殊数据与普通数据
const main = async (): Promise<void> => {
	const deleted = await prisma.promptRecord.deleteMany({ where: { ownerId: OWNER_ID } });

	const special = await writeSpecialRecords(OWNER_ID);
	const normalVersions = await writeNormalRecords(OWNER_ID);

	console.log(`已清理 ${deleted.count} 条旧收录`);
	console.log(
		`✓ 特殊测试收录 4 条（含 100 版本的版本历史压力测试），${special.versions} 个版本记录，${special.favorites} 条收藏`,
	);
	console.log(`✓ 普通收录 ${NORMAL_RECORD_COUNT} 条（各含 v1 快照），${normalVersions} 个版本记录`);
	console.log(
		`共写入 ${4 + NORMAL_RECORD_COUNT} 条收录，${special.versions + normalVersions} 个版本记录`,
	);
};

main()
	.catch((error: unknown) => {
		console.error("填充收录失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
