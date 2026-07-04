// 队列公共出口：re-export 各领域的入队函数，调用方保持从 @/shared/lib/infrastructure/queue 导入

export {
  enqueueEmailChange,
  enqueueEmailChangedNotice,
} from "./operations/email";
export {
  enqueueAvatarSync,
  enqueueDeleteUserAvatar,
} from "./operations/user";
