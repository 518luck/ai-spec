// # Discover 领域任务数据类型

// 同步单个仓库任务载荷
export interface DiscoverSyncRepoData {
	repo: string; // 仓库全名 "owner/name"
}

// 扫描任务载荷：不传 source 跑全部 awesome 源（cron 用），传 source 只跑指定源（测试用）
export interface DiscoverScanData {
	// 可选：指定单个 awesome 源（owner/name），不传则遍历 AWESOME_SOURCES 全部
	source?: string;
}

// sweep 收尾任务无载荷
export type DiscoverSweepData = Record<string, never>;

// resume 任务无载荷（撞限流暂停后由延迟 job 触发，恢复 discover 队列）
export type DiscoverResumeData = Record<string, never>;
