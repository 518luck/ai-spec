import "dotenv/config";

import { TAG_PRESET_COLORS } from "@/features/tag-combobox/config/tag-colors";
import prisma from "@/shared/db";

// 模拟当前用户（luck2 zhang / zhangluck598@gmail.com）在数据库中的 ID
const OWNER_ID = "cmrjdu92f0001099de7h2zu5p";

// 收录标签归属的资源类型（当前全站唯一可打标签的资源）
const RESOURCE_TYPE = "promptRecord";

// 标签内容模板：常见分类 + 边界场景（长名字/英文/数字/符号/emoji），用于 UI 截断与排版测试
const tagTemplates = [
	// 常见业务分类
	"写作助手",
	"代码生成",
	"代码审查",
	"测试用例",
	"Bug 修复",
	"性能优化",
	"API 设计",
	"技术方案",
	"产品需求",
	"文档总结",
	"翻译润色",
	"数据分析",
	"SQL 查询",
	"邮件撰写",
	"营销文案",
	"角色扮演",
	"头脑风暴",
	"学习辅导",
	// 边界场景：长名字（接近 32 字上限，测试截断/省略号）
	"这是一个超长的标签名称用来测试UI的截断效果啊啊啊啊啊",
	"超长英文名 Super Long Tag Name For UI Truncation Test",
	"中英混合的较长标签 Mixed Long Tag 测试一下界面显示效果",
	// 边界场景：单字符、纯英文、纯数字、符号、emoji
	"A",
	"urgent",
	"P0",
	"待办-todo",
	"💡灵感",
	"#热门话题#",
	// 边界场景：最长（正好 32 字）
	"一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十",
];

// 生成单条标签：颜色按索引在预设色盘上循环，时间按索引递增避免集中
const generateTag = (index: number) => {
	const baseDate = new Date(2026, 6, 10, 9, 0, 0, 0);
	return {
		name: tagTemplates[index],
		color: TAG_PRESET_COLORS[index % TAG_PRESET_COLORS.length],
		resourceType: RESOURCE_TYPE,
		ownerId: OWNER_ID,
		teamId: null,
		createdAt: new Date(baseDate.getTime() + index * 60 * 1000),
	};
};

// 主流程：先清空当前用户在 promptRecord 资源下的全部标签，再批量写入
const main = async (): Promise<void> => {
	const deleted = await prisma.tag.deleteMany({
		where: { ownerId: OWNER_ID, resourceType: RESOURCE_TYPE },
	});

	const tags = tagTemplates.map((_, index) => generateTag(index));

	const result = await prisma.tag.createMany({
		data: tags,
		skipDuplicates: true,
	});

	// biome-ignore lint/suspicious/noConsole: seed 脚本需要向终端反馈执行结果
	console.log(`已清理 ${deleted.count} 条旧标签，成功写入 ${result.count} 条新标签`);
};

main()
	.catch((error: unknown) => {
		console.error("填充标签失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
