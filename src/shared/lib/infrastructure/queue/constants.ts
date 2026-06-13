// 头像同步队列配置
export const AVATAR_SYNC_QUEUE_CONFIG = {
  name: "avatar-sync",
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
