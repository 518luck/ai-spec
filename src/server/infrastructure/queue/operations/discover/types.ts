// # Discover 领域任务数据类型

// 同步单个仓库任务载荷
export interface DiscoverSyncRepoData {
	repo: string; // 仓库全名 "owner/name"
	deferrals?: number; // 已因限流延迟重投的次数（防无限重投）
}

// 发现任务无载荷（货源清单读自 config 与数据库）
export type DiscoverScanData = Record<string, never>;

// sweep 收尾任务无载荷
export type DiscoverSweepData = Record<string, never>;
