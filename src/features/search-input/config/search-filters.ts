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

// > 默认筛选状态：只有标题参与搜索（业务约定：无 filter 参数时后端按此处理）
export const DEFAULT_FILTERS: SearchFilters = { title: true };

// 默认搜索词参数名
export const SEARCH_QUERY_PARAM = "q";

// filter JSON 的 URL 参数名
export const SEARCH_FILTER_PARAM = "filter";

// 默认防抖延迟（毫秒）
export const SEARCH_DEBOUNCE_MS = 300;

// 默认占位文案
export const SEARCH_PLACEHOLDER = "搜索...";
