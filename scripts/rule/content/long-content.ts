// # 超长正文生成器：5 个主题各产 ~35000 字符 markdown，压测渲染性能与大文本存储
//
// 每个生成器构造一段 ~700 字的章节模板（含多级标题/段落/列表/表格/多语言代码块/引用块），
// 重复约 50 次达 ~35000 字符，每段编号递增。正文结构丰富以全面覆盖 markdown 渲染器。

import { LONG_CONTENT_TARGET } from "../utils/constants";

type BuildLongContentOptions = {
	title: string;
	intro: string;
	sectionTemplate: (index: number) => string;
};

// > 按章节模板重复填充至目标字符数，返回完整 markdown
const buildLongContent = ({ title, intro, sectionTemplate }: BuildLongContentOptions): string => {
	const parts: string[] = [`# ${title}`, "", intro, ""];
	let index = 1;
	let total = parts.join("\n").length;

	while (total < LONG_CONTENT_TARGET) {
		const section = sectionTemplate(index);
		parts.push(section);
		total += section.length;
		index += 1;
	}

	return parts.join("\n");
};

// 章节通用子结构：列表块
const buildListBlock = (index: number): string =>
	[
		`- 第 ${index} 项：核心实现要点与注意事项`,
		`- 第 ${index + 1} 项：性能影响评估与监控指标`,
		`- 第 ${index + 2} 项：常见反模式与规避策略`,
		`- 第 ${index + 3} 项：团队协作约定与代码评审标准`,
	].join("\n");

// 章节通用子结构：表格块
const buildTableBlock = (index: number): string =>
	[
		`| 维度 | 目标值 | 当前值 | 状态 | 备注 |`,
		`| --- | --- | --- | --- | --- |`,
		`| 首屏渲染 | ${1500 - index}ms | ${1200 + index}ms | ✅ | 达标 |`,
		`| 交互延迟 | ${200 - index}ms | ${180 + index}ms | ✅ | 达标 |`,
		`| 包体积 | ${200 + index}KB | ${240 + index}KB | ❌ | 待优化 |`,
		`| 错误率 | 0.${index}% | 0.0${index}% | ✅ | 达标 |`,
	].join("\n");

// 章节通用子结构：引用块
const buildQuoteBlock = (index: number): string =>
	`> 原则 ${index}：优化的核心在于测量而非猜测，先建立性能基线，再逐项验证每项改动是否真正带来提升，避免过早优化引入复杂度。`;

// > 1. 前端工程化完全指南
export const buildFrontendGuide = (): string =>
	buildLongContent({
		title: "前端工程化完全指南",
		intro:
			"本指南系统覆盖前端工程化的各个层面：模块化、构建打包、代码分割、懒加载、按需加载、Tree Shaking、缓存策略与性能监控。每章节包含理论、代码示例与评估指标，全文约三万五千字，用于压测 Markdown 大文本渲染性能与全文复制功能。",
		sectionTemplate: (index) =>
			[
				`## 第 ${index} 章：工程化实践要点`,
				"",
				`前端工程化的第 ${index} 个核心实践是构建流程的标准化。通过统一的构建配置与插件体系，团队可以确保产物在不同环境下行为一致。`,
				"",
				"```javascript",
				"// webpack 构建配置示例：代码分割与缓存",
				`const config${index} = {`,
				"  optimization: {",
				"    splitChunks: {",
				"      chunks: 'all',",
				"      cacheGroups: {",
				"        vendor: {",
				"          test: /[\\\\/]node_modules[\\\\/]/,",
				"          name: 'vendors',",
				"          priority: 10,",
				"        },",
				"      },",
				"    },",
				"  },",
				"};",
				"```",
				"",
				buildListBlock(index),
				"",
				buildTableBlock(index),
				"",
				buildQuoteBlock(index),
				"",
			].join("\n"),
	});

// > 2. 后端架构设计手册
export const buildBackendGuide = (): string =>
	buildLongContent({
		title: "后端架构设计手册",
		intro:
			"本手册聚焦后端架构设计的核心议题：分层架构、领域驱动设计、数据库设计、缓存策略、消息队列、分布式事务与可观测性。每章配有架构图描述、代码片段与权衡分析，全文约三万五千字。",
		sectionTemplate: (index) =>
			[
				`## 第 ${index} 章：后端架构模式`,
				"",
				`后端架构的第 ${index} 个关键模式是关注点分离。通过清晰的分层与模块边界，系统在演进过程中能保持可维护性与可测试性。`,
				"",
				"```typescript",
				"// 分层架构示例：Controller → Service → Repository",
				`class Service${index} {`,
				"  constructor(private readonly repo: Repository) {}",
				"",
				"  async execute(input: Input): Promise<Output> {",
				"    const validated = this.validate(input);",
				"    const entity = await this.repo.findById(validated.id);",
				"    if (!entity) throw new NotFoundError();",
				"    return this.toOutput(entity);",
				"  }",
				"}",
				"```",
				"",
				buildListBlock(index),
				"",
				buildTableBlock(index),
				"",
				buildQuoteBlock(index),
				"",
			].join("\n"),
	});

// > 3. TypeScript 高级类型详解
export const buildTypescriptGuide = (): string =>
	buildLongContent({
		title: "TypeScript 高级类型详解",
		intro:
			"本文深入 TypeScript 类型系统：条件类型、映射类型、模板字面量类型、类型推断、类型体操与类型安全设计模式。每章包含类型定义、推导过程与实际应用，全文约三万五千字。",
		sectionTemplate: (index) =>
			[
				`## 第 ${index} 章：高级类型技巧`,
				"",
				`TypeScript 类型系统的第 ${index} 个高级技巧是条件类型与分发。通过 infer 关键字提取类型组件，可以实现极其灵活的类型推导。`,
				"",
				"```typescript",
				"// 条件类型与 infer：提取函数返回类型",
				`type ReturnType${index}<T> = T extends (...args: never[]) => infer R ? R : never;`,
				"",
				"// 映射类型：将对象所有属性变为可选",
				`type Partial${index}<T> = {`,
				"  [P in keyof T]?: T[P];",
				"};",
				"",
				"// 模板字面量类型：方法名约定",
				`type Action${index} = \`on\${Capitalize<string>}\`;`,
				"```",
				"",
				buildListBlock(index),
				"",
				buildTableBlock(index),
				"",
				buildQuoteBlock(index),
				"",
			].join("\n"),
	});

// > 4. React 性能优化全攻略
export const buildReactPerfGuide = (): string =>
	buildLongContent({
		title: "React 性能优化全攻略",
		intro:
			"本攻略覆盖 React 性能优化的全链路：渲染优化、状态管理、虚拟列表、代码分割、SSR/SSG、缓存策略与性能监控。每章配有代码示例与基准对比，全文约三万五千字。",
		sectionTemplate: (index) =>
			[
				`## 第 ${index} 章：React 渲染优化`,
				"",
				`React 性能优化的第 ${index} 个策略是避免不必要的重渲染。通过 memo、useMemo、useCallback 与状态下沉，可显著减少渲染开销。`,
				"",
				"```tsx",
				"// memo + useCallback 避免子组件重渲染",
				`const Child${index} = React.memo(({ onClick }: { onClick: () => void }) => {`,
				"  return <button onClick={onClick}>Click</button>;",
				"});",
				"",
				"function Parent() {",
				"  const [count, setCount] = useState(0);",
				"  const handleClick = useCallback(() => setCount((c) => c + 1), []);",
				"  return <Child onClick={handleClick} />;",
				"}",
				"```",
				"",
				buildListBlock(index),
				"",
				buildTableBlock(index),
				"",
				buildQuoteBlock(index),
				"",
			].join("\n"),
	});

// > 5. DevOps 与 CI/CD 实践指南
export const buildDevopsGuide = (): string =>
	buildLongContent({
		title: "DevOps 与 CI/CD 实践指南",
		intro:
			"本指南系统讲解 DevOps 实践：持续集成、持续交付、容器化、基础设施即代码、监控告警与灰度发布。每章含流水线配置、脚本示例与故障排查，全文约三万五千字。",
		sectionTemplate: (index) =>
			[
				`## 第 ${index} 章：CI/CD 流水线实践`,
				"",
				`DevOps 实践的第 ${index} 个环节是流水线编排。通过阶段化构建、并行测试与自动部署，团队可实现高频安全发布。`,
				"",
				"```yaml",
				"# GitHub Actions 流水线示例",
				`name: CI Pipeline ${index}`,
				"on: [push, pull_request]",
				"jobs:",
				"  build:",
				"    runs-on: ubuntu-latest",
				"    steps:",
				"      - uses: actions/checkout@v4",
				"      - run: pnpm install --frozen-lockfile",
				"      - run: pnpm run typecheck",
				"      - run: pnpm run lint",
				"      - run: pnpm test",
				"      - run: pnpm build",
				"```",
				"",
				buildListBlock(index),
				"",
				buildTableBlock(index),
				"",
				buildQuoteBlock(index),
				"",
			].join("\n"),
	});

// @ 超长正文生成器清单：seed-rules 按序调用，每条对应一个主题规则
export const LONG_CONTENT_BUILDERS = [
	buildFrontendGuide,
	buildBackendGuide,
	buildTypescriptGuide,
	buildReactPerfGuide,
	buildDevopsGuide,
] as const;

// 超长正文规则名称清单：与生成器一一对应
export const LONG_CONTENT_NAMES = [
	"前端工程化完全指南（超长正文）",
	"后端架构设计手册（超长正文）",
	"TypeScript 高级类型详解（超长正文）",
	"React 性能优化全攻略（超长正文）",
	"DevOps 与 CI/CD 实践指南（超长正文）",
] as const;
