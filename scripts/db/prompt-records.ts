import "dotenv/config";

import { randomBytes } from "node:crypto";
import prisma from "@/shared/db";

// 模拟当前用户（luck2 zhang / zhangluck598@gmail.com）在数据库中的 ID
const OWNER_ID = "cmrjdu92f0001099de7h2zu5p";

// 生成目标数量
const RECORD_COUNT = 250;

// 收录模板，按业务主题分组，复用草稿侧的正式段落内容以保持风格一致
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

// 自增计数器，用于保证 ID 片段唯一
let idCounter = 0;

// 生成类似 CUID 的 25 位标识符，格式为 c + 8位时间 + 4位计数 + 12位随机
const generateCuidLike = (): string => {
	const timestamp = Date.now().toString(36).slice(-8).padStart(8, "m");
	const counter = (idCounter++).toString(36).padStart(4, "0");
	const randomPart = Array.from(randomBytes(9))
		.map((b) => b.toString(36).padStart(2, "0"))
		.join("")
		.slice(0, 12);
	return `c${timestamp}${counter}${randomPart}`;
};

// 返回 [min, max] 闭区间内的随机整数
const randomInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

// 生成单条收录数据：使用次数取随机值以驱动常用排序，时间按索引递增避免集中
const generateRecord = (
	index: number,
): {
	id: string;
	name: string;
	content: string;
	images: string[];
	visibility: "private";
	teamId: null;
	sourceRecordId: null;
	useCount: number;
	ownerId: string;
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

	return {
		id: generateCuidLike(),
		name: `${template.name}-${serial}`,
		content: template.content,
		images: [],
		visibility: "private",
		teamId: null,
		sourceRecordId: null,
		useCount: randomInt(0, 50),
		ownerId: OWNER_ID,
		lastEditorId: null,
		folderId: null,
		createdAt,
		updatedAt,
	};
};

// 主流程：先清空当前用户个人空间内的全部收录，再批量写入固定数量的新收录
const main = async (): Promise<void> => {
	const deleted = await prisma.promptRecord.deleteMany({
		where: { ownerId: OWNER_ID },
	});

	const records = Array.from({ length: RECORD_COUNT }, (_, index) => generateRecord(index));

	const result = await prisma.promptRecord.createMany({
		data: records,
	});

	// biome-ignore lint/suspicious/noConsole: seed 脚本需要向终端反馈执行结果
	console.log(`已清理 ${deleted.count} 条旧收录，成功写入 ${result.count} 条新收录`);
};

main()
	.catch((error: unknown) => {
		console.error("填充收录失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
