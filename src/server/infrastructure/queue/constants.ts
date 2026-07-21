// # 后台任务队列配置：所有任务共用一个队列，按 job.name 路由分发

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

// 后台任务的 job.name 枚举，Worker 据此路由到对应处理器
export const JOB_NAMES = {
	avatarSync: "avatar-sync",
	avatarCleanup: "avatar-cleanup",
	emailChange: "email-change",
	emailChangedNotice: "email-changed-notice",
	flushCopyCount: "flush-copy-count",
} as const;
