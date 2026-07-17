// # 搜索筛选状态编解码：扁平 JSON ↔ base64，前后端共享同一份实现

// 扁平 filter 状态类型：boolean 字段（title/content）+ 未来的 string 字段（tag/folder）
export type SearchFilters = Partial<{
	title: boolean;
	content: boolean;
}>;

// > 编码 filter 状态为 URL 参数值：先 base64 再 encodeURIComponent（base64 的 +/= 在 URL 里有特殊含义，必须包裹）
export const encodeFilters = (filters: SearchFilters): string =>
	encodeURIComponent(btoa(JSON.stringify(filters)));

// > 解码 URL 参数值为 filter 状态；空值或解码失败返回 undefined（调用方按默认值处理）
export const decodeFilters = (encoded: string | undefined): SearchFilters | undefined => {
	if (!encoded) return undefined;
	try {
		return JSON.parse(atob(decodeURIComponent(encoded))) as SearchFilters;
	} catch {
		return undefined;
	}
};
