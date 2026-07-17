// # 搜索筛选配置：内置字段定义 + filter JSON 编解码 + 默认值

import type { SearchFieldDefinition, SearchFieldKey } from "../model/types";

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

// # filter 状态的类型：所有字段开关的当前值集合
// boolean 字段用 true/false，字符串字段（未来的 tag/folder）用具体值；未出现表示该字段未激活
export type SearchFilters = Partial<{
	title: boolean;
	content: boolean;
}>;

// > 将 filter 状态编码为 base64 字符串，写入 URL 的 filter= 参数
// ! 用 encodeURIComponent 包裹 base64：base64 的 +/= 在 URL 里有特殊含义，不编码会导致解析错误
export const encodeFilters = (filters: SearchFilters): string =>
	encodeURIComponent(btoa(JSON.stringify(filters)));

// > 将 URL 里 filter= 参数的值解码为 filter 状态；非法值返回 undefined
export const decodeFilters = (encoded: string | undefined): SearchFilters | undefined => {
	if (!encoded) return undefined;
	try {
		return JSON.parse(atob(decodeURIComponent(encoded))) as SearchFilters;
	} catch {
		return undefined;
	}
};
