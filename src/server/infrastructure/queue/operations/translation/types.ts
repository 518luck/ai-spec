// # Translation 领域任务数据类型

// 已接入批量补译的资源类型（加新资源：注册 target + 扩这个联合类型）
export type TranslationResourceType = "skills";

// 批量补译任务载荷
export interface TranslateBatchData {
	// 资源类型：决定从哪张表取 pending、写回哪几个字段
	resourceType: TranslationResourceType;
	// 本批最多处理多少条；不传用 TRANSLATION_BATCH_LIMIT
	limit?: number;
	// 是否在本批结束后若仍有待译则自动再投下一 intern（默认 true）
	chain?: boolean;
}
