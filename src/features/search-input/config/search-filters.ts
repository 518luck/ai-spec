// # 搜索筛选配置：内置字段定义 + 默认值；编解码复用 shared/lib 的共享实现

import type { SearchFilters } from "@/shared/lib/search-filter";
import type { SearchFieldDefinition, SearchFieldKey } from "../model/types";

export type { SearchFilters } from "@/shared/lib/search-filter";
// > 编解码实现从 shared/lib 统一导入（前后端共享，避免 atob/btoa 重复实现）
export { decodeFilters, encodeFilters } from "@/shared/lib/search-filter";

// @ 内置搜索字段全集：新增字段（如 tag、folder）在此追加，并同步 SearchFieldKey 类型
// > 字段语义：title/content 是布尔开关（true=参与搜索），tag/folder 是字符串值
export const SEARCH_FIELDS: Record<SearchFieldKey, SearchFieldDefinition> = {
	// 标题：默认参与搜索（开关型，true=搜 name 字段）
	title: {
		key: "title",
		text: "标题",
		type: "boolean",
	},
	// 内容：默认不参与搜索（开关型，true=搜 content 字段）
	content: {
		key: "content",
		text: "内容",
		type: "boolean",
	},
};

// > 按 field key 构造默认 filter（只激活该字段）：使用方决定初始选中哪个字段，如草稿页用 buildDefaultFilter("title")
export const buildDefaultFilter = (key: SearchFieldKey): SearchFilters => ({ [key]: true });

// 默认搜索词参数名
export const SEARCH_QUERY_PARAM = "q";

// filter JSON 的 URL 参数名
export const SEARCH_FILTER_PARAM = "filter";

// 默认防抖延迟（毫秒）
export const SEARCH_DEBOUNCE_MS = 300;

// > 根据 filter 状态生成 placeholder：把激活字段的 text 用"和"连接，让用户直观看到当前搜的是哪些字段
// 规则：{title:true} → "搜索标题..."；{content:true} → "搜索内容..."；都选 → "搜索标题和内容..."；都没选 → "搜索..."
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
