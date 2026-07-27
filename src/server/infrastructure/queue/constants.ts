// # 后台任务队列配置：background-jobs 通用业务；discover 跑 GitHub 抓取；translation 跑机翻补译

// > 默认重试 3 次、指数退避 5s 起；processor 需保证幂等，因为失败会自动重投
export const BACKGROUND_JOBS_QUEUE_CONFIG = {
	name: "background-jobs",
	jobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 5000,
		},
		removeOnComplete: 100,
		removeOnFail: 200,
	},
} as const;

// > discover 队列独立：scan/sync-repo/sweep 都在这，撞 GitHub 限流时整队列暂停，由延迟 job 触发 resume
export const DISCOVER_QUEUE_CONFIG = {
	name: "discover",
	jobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 5000,
		},
		removeOnComplete: 100,
		removeOnFail: 200,
	},
} as const;

// > translation 队列独立：机翻补译有自己的并发与限流，不和邮件/头像抢 background，也不占 GitHub 串行线
export const TRANSLATION_QUEUE_CONFIG = {
	name: "translation",
	jobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 5000,
		},
		removeOnComplete: 100,
		removeOnFail: 200,
	},
} as const;

// 后台任务的 job.name 枚举，Worker 据此路由到对应处理器
export const JOB_NAMES = {
	avatarSync: "avatar-sync",
	avatarCleanup: "avatar-cleanup",
	emailChange: "email-change",
	emailChangedNotice: "email-changed-notice",
	discoverScan: "discover-scan",
	discoverSyncRepo: "discover-sync-repo",
	discoverSweep: "discover-sweep",
	// discover 队列熔断恢复任务（撞 GitHub 限流暂停后，由延迟 job 到点触发 resume）
	discoverResume: "discover-resume",
	// translation 队列：按 resourceType 批量补译（skills 已接，plugins 等可后续注册 target）
	translateBatch: "translate-batch",
} as const;
