// # 后台任务数据类型：re-export 各领域类型，并汇总为联合类型供 Worker 路由

// re-export 各领域任务数据类型，外部仍可统一从这里导入

export type {
	DiscoverResumeData,
	DiscoverScanData,
	DiscoverSweepData,
	DiscoverSyncRepoData,
} from "./operations/discover/types";
export type {
	EmailChangeData,
	EmailChangedNoticeData,
} from "./operations/email/types";
export type {
	TranslateBatchData,
	TranslationResourceType,
} from "./operations/translation/types";
export type {
	DeleteUserAvatarData,
	SyncOauthAvatarData,
} from "./operations/user/types";

import type { DiscoverResumeData } from "./operations/discover/types";
import type { EmailChangeData, EmailChangedNoticeData } from "./operations/email/types";
// 后台任务数据的联合类型，供 Worker 路由时类型收窄
import type { DeleteUserAvatarData, SyncOauthAvatarData } from "./operations/user/types";

// background-jobs 队列的任务数据联合类型
// ! discover 的 scan/sync-repo/sweep 在独立 discover 队列；translate 在独立 translation 队列
// ! discover-resume 虽属 discover 领域，但投在 background-jobs（撞限流暂停 discover 后，resume 必须能在 discover 暂停时执行）
export type BackgroundJobData =
	| SyncOauthAvatarData
	| DeleteUserAvatarData
	| EmailChangeData
	| EmailChangedNoticeData
	| DiscoverResumeData;
