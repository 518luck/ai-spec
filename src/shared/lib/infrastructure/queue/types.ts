// re-export 各领域任务数据类型，外部仍可统一从这里导入

export type {
  EmailChangeData,
  EmailChangedNoticeData,
} from "./operations/email/types";
export type {
  DeleteUserAvatarData,
  SyncOauthAvatarData,
} from "./operations/user/types";

import type { EmailChangeData, EmailChangedNoticeData } from "./operations/email/types";
// 后台任务数据的联合类型，供 Worker 路由时类型收窄
import type { DeleteUserAvatarData, SyncOauthAvatarData } from "./operations/user/types";

export type BackgroundJobData =
  | SyncOauthAvatarData
  | DeleteUserAvatarData
  | EmailChangeData
  | EmailChangedNoticeData;
