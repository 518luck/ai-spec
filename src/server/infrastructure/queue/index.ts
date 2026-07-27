// 队列公共出口：re-export 各领域的入队函数，调用方保持从 @/server/infrastructure/queue 导入

export {
	enqueueDiscoverScan,
	enqueueDiscoverSweep,
	enqueueDiscoverSyncRepo,
} from "./operations/discover";
export {
	enqueueEmailChange,
	enqueueEmailChangedNotice,
} from "./operations/email";
export { enqueueTranslateBatch } from "./operations/translation";
export {
	enqueueAvatarSync,
	enqueueDeleteUserAvatar,
} from "./operations/user";
