// # 提示词领域任务数据类型

// 落库 copy_count 增量：recordId 对应的 record 把 Redis 缓冲的复制次数写入 DB
export interface FlushCopyCountData {
	recordId: string;
}
