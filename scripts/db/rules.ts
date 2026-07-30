import "dotenv/config";

import prisma from "@/shared/db";

// # 规约填充脚本：生成 200 条覆盖正常 + 边缘场景的测试规约
//
// 数据分两类：
//   1. 业务模板（ruleTemplates）：贴近真实规约，覆盖常见编码规范主题
//   2. 边缘模板（edgeTemplates）：压测渲染与截断——超长名称/超长正文/纯代码/特殊字符/空行等
// 生成时按比例混合，确保列表分页、预览截断、代码高亮、特殊字符转义都有数据可验。

// 模拟当前用户在数据库中的 ID
const OWNER_ID = "cmrjdu92f0001099de7h2zu5p";

// 规约生成数量
const RULE_COUNT = 200;

// @ 业务模板：按真实规约主题分组，每条含 markdown 正文 + 代码块
const ruleTemplates = [
	{
		name: "使用函数组件",
		content: [
			"# React 组件规范",
			"",
			"## 函数组件",
			"",
			"所有新组件必须使用函数声明，禁止使用 class 组件。",
			"",
			"```tsx",
			"// ✅ 正确",
			"function MyComponent({ name }: Props): JSX.Element {",
			"  return <div>{name}</div>;",
			"}",
			"",
			"// ❌ 错误",
			"class MyComponent extends React.Component {",
			"  render() {",
			"    return <div>{this.props.name}</div>;",
			"  }",
			"}",
			"```",
			"",
			"## Props 类型",
			"",
			"Props 必须显式声明类型，使用 interface 而非 type。",
			"",
			"```tsx",
			"interface Props {",
			"  name: string;",
			"  onClick: () => void;",
			"}",
			"```",
		].join("\n"),
	},
	{
		name: "避免 any 类型",
		content: [
			"# TypeScript 类型规范",
			"",
			"## 禁止 any",
			"",
			"所有代码禁止使用 `any` 类型，必须明确指定类型。",
			"",
			"```typescript",
			"// ❌ 错误",
			"const data: any = fetchData();",
			"",
			"// ✅ 正确",
			"const data: UserData = fetchData();",
			"```",
			"",
			"## 类型断言",
			"",
			"避免使用 `as` 进行类型断言，优先使用类型守卫。",
			"",
			"```typescript",
			"// ❌ 避免",
			"const value = data as string;",
			"",
			"// ✅ 推荐",
			"if (typeof data === 'string') {",
			"  const value = data;",
			"}",
			"```",
		].join("\n"),
	},
	{
		name: "错误必须显式处理",
		content: [
			"# 错误处理规范",
			"",
			"## 显式处理",
			"",
			"所有错误必须显式处理，禁止忽略错误。",
			"",
			"```typescript",
			"// ❌ 错误：忽略错误",
			"fetchData();",
			"",
			"// ✅ 正确：显式处理",
			"try {",
			"  await fetchData();",
			"} catch (error) {",
			"  toast.error('获取数据失败');",
			"}",
			"```",
			"",
			"## 错误类型",
			"",
			"使用项目统一的错误类型，不要直接抛出原生 Error。",
			"",
			"```typescript",
			"import { AiSpecError } from '@/server/errors/http-error';",
			"",
			"throw new AiSpecError({",
			"  code: ErrorCode.NOT_FOUND,",
			"  message: '资源不存在',",
			"});",
			"```",
		].join("\n"),
	},
	{
		name: "使用 Tailwind CSS",
		content: [
			"# 样式规范",
			"",
			"## Tailwind CSS",
			"",
			"优先使用 Tailwind CSS 工具类，避免自定义 CSS。",
			"",
			"```tsx",
			"// ✅ 正确",
			'<div className="flex items-center gap-2 p-4">',
			'  <span className="text-sm font-medium">标题</span>',
			"</div>",
			"",
			"// ❌ 错误",
			"<div style={{ display: 'flex', padding: '16px' }}>",
			"  <span style={{ fontSize: '14px' }}>标题</span>",
			"</div>",
			"```",
			"",
			"## 颜色变量",
			"",
			"使用 CSS 变量引用主题色，不要硬编码颜色值。",
			"",
			"```tsx",
			"// ✅ 正确",
			'<div className="text-primary bg-background">',
			"",
			"// ❌ 错误",
			'<div className="text-blue-500 bg-white">',
			"```",
		].join("\n"),
	},
	{
		name: "Git 提交规范",
		content: [
			"# Git 提交规范",
			"",
			"## 提交信息格式",
			"",
			"使用 Conventional Commits 格式：",
			"",
			"```",
			"<type>(<scope>): <subject>",
			"",
			"[optional body]",
			"",
			"[optional footer]",
			"```",
			"",
			"## 类型说明",
			"",
			"- `feat`: 新功能",
			"- `fix`: 修复 bug",
			"- `docs`: 文档更新",
			"- `style`: 代码格式（不影响功能）",
			"- `refactor`: 重构",
			"- `test`: 测试相关",
			"- `chore`: 构建/工具相关",
			"",
			"## 示例",
			"",
			"```",
			"feat(auth): 添加 Google OAuth 登录",
			"",
			"fix(api): 修复用户列表分页错误",
			"",
			"docs: 更新 README 安装说明",
			"```",
		].join("\n"),
	},
	{
		name: "API 接口规范",
		content: [
			"# API 接口规范",
			"",
			"## RESTful 设计",
			"",
			"接口遵循 RESTful 设计原则：",
			"",
			"- GET：获取资源",
			"- POST：创建资源",
			"- PUT/PATCH：更新资源",
			"- DELETE：删除资源",
			"",
			"## 响应格式",
			"",
			"统一返回 JSON 格式：",
			"",
			"```json",
			"{",
			'  "data": {},',
			'  "error": {',
			'    "message": "错误信息",',
			'    "code": "ERROR_CODE"',
			"  }",
			"}",
			"```",
			"",
			"## 状态码",
			"",
			"- 200：成功",
			"- 201：创建成功",
			"- 400：请求参数错误",
			"- 401：未授权",
			"- 403：禁止访问",
			"- 404：资源不存在",
			"- 500：服务器内部错误",
		].join("\n"),
	},
	{
		name: "数据库查询优化",
		content: [
			"# 数据库查询优化",
			"",
			"## 索引使用",
			"",
			"为高频查询字段添加索引：",
			"",
			"```prisma",
			"@@index([ownerId])",
			"@@index([createdAt])",
			"```",
			"",
			"## 分页查询",
			"",
			"使用 offset 分页，避免一次性加载大量数据：",
			"",
			"```typescript",
			"const data = await prisma.rule.findMany({",
			"  take: 30,",
			"  skip: offset,",
			"  orderBy: { updatedAt: 'desc' },",
			"});",
			"```",
			"",
			"## 选择字段",
			"",
			"只查询需要的字段，减少数据传输：",
			"",
			"```typescript",
			"const data = await prisma.rule.findMany({",
			"  select: {",
			"    id: true,",
			"    name: true,",
			"    content: true,",
			"  },",
			"});",
			"```",
		].join("\n"),
	},
	{
		name: "测试编写规范",
		content: [
			"# 测试编写规范",
			"",
			"## 测试覆盖",
			"",
			"核心功能必须有测试覆盖：",
			"",
			"- 正常流程测试",
			"- 异常流程测试",
			"- 边界条件测试",
			"",
			"## 测试结构",
			"",
			"使用 AAA 模式（Arrange-Act-Assert）：",
			"",
			"```typescript",
			"test('should create rule', async () => {",
			"  // Arrange",
			"  const input = { name: 'test', content: 'content' };",
			"",
			"  // Act",
			"  const result = await createRule(input);",
			"",
			"  // Assert",
			"  expect(result.name).toBe('test');",
			"});",
			"```",
			"",
			"## 测试命名",
			"",
			"测试名称应清晰描述测试内容：",
			"",
			"```typescript",
			"// ✅ 正确",
			"test('should return 404 when rule not found')",
			"",
			"// ❌ 错误",
			"test('test1')",
			"```",
		].join("\n"),
	},
	{
		name: "性能优化指南",
		content: [
			"# 性能优化指南",
			"",
			"## React 性能",
			"",
			"### 避免不必要的重渲染",
			"",
			"```tsx",
			"// ✅ 使用 memo 避免重渲染",
			"const MemoizedComponent = React.memo(Component);",
			"",
			"// ✅ 使用 useMemo 缓存计算结果",
			"const expensiveResult = useMemo(() => compute(data), [data]);",
			"",
			"// ✅ 使用 useCallback 缓存函数",
			"const handleClick = useCallback(() => {",
			"  // ...",
			"}, []);",
			"```",
			"",
			"## 数据加载",
			"",
			"使用 SWR 进行数据缓存和自动重新验证：",
			"",
			"```tsx",
			"const { data, error } = useSWR('/api/rules', fetcher);",
			"```",
			"",
			"## 图片优化",
			"",
			"使用 Next.js Image 组件自动优化图片：",
			"",
			"```tsx",
			"import Image from 'next/image';",
			"",
			"<Image",
			'  src="/photo.jpg"',
			'  alt="描述"',
			"  width={500}",
			"  height={300}",
			"/>",
			"```",
		].join("\n"),
	},
	{
		name: "安全编码规范",
		content: [
			"# 安全编码规范",
			"",
			"## 输入验证",
			"",
			"所有用户输入必须验证：",
			"",
			"```typescript",
			"import { z } from 'zod';",
			"",
			"const schema = z.object({",
			"  name: z.string().min(1).max(100),",
			"  email: z.string().email(),",
			"});",
			"",
			"const result = schema.safeParse(input);",
			"if (!result.success) {",
			"  throw new Error('输入验证失败');",
			"}",
			"```",
			"",
			"## SQL 注入防护",
			"",
			"使用参数化查询，禁止拼接 SQL：",
			"",
			"```typescript",
			"// ✅ 正确：使用 Prisma",
			"await prisma.user.findMany({",
			"  where: { email: userInput },",
			"});",
			"",
			"// ❌ 错误：拼接 SQL",
			// biome-ignore lint/suspicious/noTemplateCurlyInString: 字面演示 SQL 注入反面教材，${userInput} 是示例文本而非真实插值
			"await prisma.$queryRaw(`SELECT * FROM users WHERE email = '${userInput}'`);",
			"```",
			"",
			"## XSS 防护",
			"",
			"渲染用户内容时进行转义：",
			"",
			"```tsx",
			"// ✅ 正确：React 自动转义",
			"<div>{userContent}</div>",
			"",
			"// ❌ 错误：直接渲染 HTML",
			"<div dangerouslySetInnerHTML={{ __html: userContent }} />",
			"```",
		].join("\n"),
	},
];

// @ 边缘模板：压测列表预览截断、代码高亮、特殊字符转义、超长渲染
// 每条针对一个具体的渲染/存储压力点，正文形态刻意极端
const edgeTemplates = [
	{
		// 超长名称：逼近 64 字符上限，测列表名称列的 truncate 与换行
		name: "这是一个非常非常非常长的规约名称用来测试表格列截断与 tooltip 完整展示一二三四五六七八九十一二三四五六",
		content:
			"# 超长名称测试\n\n本条规约的名称接近 64 字符上限，用于验证列表名称列的 `truncate` 是否生效，以及鼠标悬停时 tooltip 能否完整展示。",
	},
	{
		// 超长正文：单段无换行长文本，测预览截断（120 字符）和大正文存储
		name: "超长单段正文",
		content: `# 超长正文压测\n\n${"这是一段用于压测预览截断与正文渲染的超长文本，重复填充以观察 UI 表现。".repeat(30)}`,
	},
	{
		// 纯代码无说明：正文只有代码块，测代码高亮在零上下文时的渲染
		name: "纯代码无文字说明",
		content:
			"```typescript\n// 无任何文字说明，只有代码块\nexport const debounce = <T extends (...args: any[]) => void>(fn: T, delay = 300) => {\n  let timer: ReturnType<typeof setTimeout>;\n  return (...args: Parameters<T>) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n};\n```",
	},
	{
		// 嵌套代码块：用更多反引号围栏，测 markdown 解析器的围栏匹配
		name: "嵌套代码块围栏",
		content:
			"# 嵌套代码块\n\n外层用四个反引号，内层用三个，测解析：\n\n````markdown\n```typescript\nconst x = 1;\n```\n````",
	},
	{
		// 特殊字符：含 emoji、HTML 实体、引号、反斜杠，测转义与存储
		name: "特殊字符与 Emoji",
		content:
			"# 特殊字符测试\n\n含 Emoji：🎉🚀✅❌💡\n\n含 HTML 实体：&lt;script&gt;alert(1)&lt;/script&gt;\n\n含引号与反斜杠：\"双引号\" '单引号' C:\\\\Users\\\\path\n\n含 markdown 符号：*星号* _下划线_ [链接](https://example.com)",
	},
	{
		// 中英日混排：测等宽与比例字体混排时的对齐
		name: "中英日韩混排文本",
		content:
			"# 多语言混排\n\n中文 English 日本語 한국어 Mixed Text 12345\n\n代码中混排：`变量名 name 変数 名前 변수 이름`",
	},
	{
		// 超多换行：连续空行，测渲染时的空白折叠与高度
		name: "连续空行测试",
		content: `# 连续空行\n\n第一段。\n${"\n".repeat(15)}中间隔了大量空行。\n${"\n".repeat(10)}最后一段。`,
	},
	{
		// 极短正文：只有一个标题，测最小内容的渲染与高度
		name: "只有一个标题",
		content: "# 极简",
	},
	{
		// 超长单行代码：代码块内一行极长，测横向滚动
		name: "超长单行代码",
		content:
			"# 超长单行代码\n\n```typescript\nconst veryLongVariableName = someFunction(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16, arg17, arg18, arg19, arg20);\n```",
	},
	{
		// 表格语法：测 GFM 表格渲染
		name: "Markdown 表格语法",
		content:
			"# 规则对照表\n\n| 规则 | 正确 | 错误 |\n|------|------|------|\n| 组件 | 函数式 | class |\n| 类型 | 显式 | any |\n| 样式 | Tailwind | inline style |",
	},
];

// 返回 [min, max] 闭区间内的随机整数
const randomInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

// > 生成单条规约数据：前 N 条走业务模板，其后混入边缘模板压测
const generateRule = (
	index: number,
	spaceId: string,
): {
	name: string;
	content: string;
	ownerId: string;
	spaceId: string;
	folderId: null;
	createdAt: Date;
	updatedAt: Date;
} => {
	// 业务模板与边缘模板的分界：前 150 条用业务模板，后 50 条用边缘模板
	const useEdge = index >= 150;
	const template = useEdge
		? edgeTemplates[(index - 150) % edgeTemplates.length]
		: ruleTemplates[index % ruleTemplates.length];
	// 同模板重复时加序号区分
	const serial = useEdge
		? Math.floor((index - 150) / edgeTemplates.length) + 1
		: Math.floor(index / ruleTemplates.length) + 1;
	const baseDate = new Date(2026, 6, 10, 9, 0, 0, 0);
	const createdAt = new Date(baseDate.getTime() + index * 7 * 60 * 1000);
	const updatedAt = new Date(createdAt.getTime() + randomInt(0, 60) * 1000);

	return {
		name: serial > 1 ? `${template.name} v${serial}` : template.name,
		content: template.content,
		ownerId: OWNER_ID,
		spaceId,
		folderId: null,
		createdAt,
		updatedAt,
	};
};

// 主流程：先清空当前用户的规约，再写入新数据
const main = async (): Promise<void> => {
	// 获取或创建用户的个人规则空间
	let space = await prisma.ruleSpace.findFirst({
		where: { ownerId: OWNER_ID, teamId: null },
		select: { id: true },
	});

	if (!space) {
		space = await prisma.ruleSpace.create({
			data: {
				name: "我的规约",
				icon: "rules",
				ownerId: OWNER_ID,
				teamId: null,
			},
			select: { id: true },
		});
		console.log("✓ 创建个人规则空间");
	}

	// 清空当前用户的规约
	const deleted = await prisma.rule.deleteMany({ where: { ownerId: OWNER_ID } });

	// 生成规约数据
	const rules = Array.from({ length: RULE_COUNT }, (_, index) => generateRule(index, space.id));

	// 批量写入规约
	await prisma.rule.createMany({ data: rules });

	console.log(`已清理 ${deleted.count} 条旧规约`);
	console.log(`✓ 写入 ${RULE_COUNT} 条规约`);
	console.log(`  - 业务模板规约：150 条（覆盖常见编码规范主题）`);
	console.log(`  - 边缘测试规约：50 条（超长名称/超长正文/纯代码/特殊字符等）`);
};

main()
	.catch((error: unknown) => {
		console.error("填充规约失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
