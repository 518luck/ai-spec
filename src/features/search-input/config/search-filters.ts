// # 搜索筛选配置：内置字段定义 + 范围选项 + 默认值；编解码复用 shared/lib 的共享实现

import type { SearchFilters } from "@/shared/lib/search-filter-codec";
import type {
	SearchFieldDefinition,
	SearchFieldKey,
	SearchScopeDefinition,
	SearchScopeKey,
} from "../model/types";

export type { SearchFilters } from "@/shared/lib/search-filter-codec";
// > 编解码实现从 shared/lib 统一导入（前后端共享，避免 atob/btoa 重复实现）
export { decodeFilters, encodeFilters } from "@/shared/lib/search-filter-codec";

// @ 内置搜索字段全集：新增开关字段在此追加，并同步 SearchFieldKey 类型
// > 字段语义：title/content/description 均为布尔开关（true=参与搜索）
export const SEARCH_FIELDS: Record<SearchFieldKey, SearchFieldDefinition> = {
	// 标题/名字：默认参与搜索（开关型，true=搜名称类字段；项目内配置等以文件名为标识的页面用）
	title: {
		key: "title",
		text: "标题",
		type: "boolean",
	},
	// 内容：默认不参与搜索（开关型，true=搜 content 字段；prompt/rules 等有正文的页面用）
	content: {
		key: "content",
		text: "内容",
		type: "boolean",
	},
	// 描述：默认不参与搜索（开关型；广场 skills 等只索引描述、无正文的页面用）
	description: {
		key: "description",
		text: "描述",
		type: "boolean",
	},
	// > 范围：特殊字段（单选型），弹层按它渲染范围区；选项取 SEARCH_SCOPES，值写入 filter 的 scope 键
	scope: {
		key: "scope",
		text: "范围",
		type: "single",
	},
};

// @ 内置搜索范围全集：单选（与字段的多选开关区分）；使用方传 scopes 才在弹层显示
export const SEARCH_SCOPES: Record<SearchScopeKey, SearchScopeDefinition> = {
	// 仅当前项目（默认范围）
	project: {
		key: "project",
		text: "本项目",
	},
	// 跨全部项目（搜索范围切到全项目时，结果会标注所属项目名）
	all: {
		key: "all",
		text: "全项目",
	},
};

// 范围缺省值：URL 无 filter 或未指定 scope 时视为本项目
export const DEFAULT_SEARCH_SCOPE: SearchScopeKey = "project";

// > 按 field key 构造默认 filter（只激活该字段）：使用方决定初始选中哪个布尔字段，如草稿页用 buildDefaultFilter("title")
//   scope 是单值字段不参与默认激活（由 DEFAULT_SEARCH_SCOPE 管理），传入时返回空 filter
export const buildDefaultFilter = (key: Exclude<SearchFieldKey, "scope">): SearchFilters => ({
	[key]: true,
});

// 默认搜索词参数名
export const SEARCH_QUERY_PARAM = "q";

// filter JSON 的 URL 参数名
export const SEARCH_FILTER_PARAM = "filter";

// 默认防抖延迟（毫秒）
export const SEARCH_DEBOUNCE_MS = 300;

// > 根据 filter 状态生成 placeholder：把激活字段的 text 用"和"连接，让用户直观看到当前搜的是哪些字段
// 规则：{title:true} → "搜索标题..."；{description:true} → "搜索描述..."；都选 → "搜索标题和描述..."；都没选 → "搜索..."
export const getPlaceholder = (filters: SearchFilters): string => {
	// 按 SEARCH_FIELDS 的顺序过滤出激活的字段文案
	const activeTexts = (Object.keys(SEARCH_FIELDS) as SearchFieldKey[])
		.filter((key) => filters[key] === true)
		.map((key) => SEARCH_FIELDS[key].text);
	if (activeTexts.length === 0) return "搜索...";
	// 用"和"连接：两个 → "标题和内容"；更多字段 → "标题、内容和标签"（暂未用到，预留扩展）
	if (activeTexts.length === 1) return `搜索${activeTexts[0]}...`;
	if (activeTexts.length === 2) return `搜索${activeTexts[0]}和${activeTexts[1]}...`;
	return `搜索${activeTexts.slice(0, -1).join("、")}和${activeTexts.at(-1)}...`;
};
