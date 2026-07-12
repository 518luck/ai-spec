// # 草稿列表配置 —— 分页、预览、排序常量（无 "use client"，服务端/客户端皆可导入）
export const PAGE_SIZE = 12;

// 草稿卡片内容预览的最大行数，超出截断
export const PREVIEW_MAX_LINES = 6;

// 草稿无标题时，用内容前 N 个字符作为展示标题
export const FALLBACK_TITLE_LENGTH = 20;

// 草稿列表排序选项，value 对应 URL ?sort= 的值
export const SORT_OPTIONS = [
	{ value: "updated", label: "最近编辑" },
	{ value: "created", label: "创建时间" },
] as const;

// 默认排序值
export const DEFAULT_SORT = "updated";
