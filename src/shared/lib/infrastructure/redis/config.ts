// Redis 连接配置统一从这里解析，业务层不要直接碰 process.env。
// 这样本地 Docker、云端 Redis、后续 provider 切换时，改这里即可。
export type RedisConnectionConfig =
  | {
      // 适合云端或托管 Redis，直接给完整连接串。
      url: string;
    }
  | {
      // 适合本地或常规 TCP 连接，按主机和端口拼装连接参数。
      host: string;
      port: number;
      password?: string;
      db?: number;
      username?: string;
    };

// 按优先级读取环境变量：
// 1. 如果提供了 REDIS_URL，优先走 URL 模式，适合云端托管服务。
// 2. 否则退回到 host/port 模式，适合本地 Docker 或自建 Redis。
// 3. 如果两种都没有，返回 null，让上层决定如何报错。
export function getRedisConnectionConfig(): RedisConnectionConfig | null {
  const {
    REDIS_URL,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
    REDIS_DB,
    REDIS_USERNAME,
  } = process.env;

  if (REDIS_URL) {
    return {
      url: REDIS_URL,
    };
  }

  if (!REDIS_HOST) {
    return null;
  }

  return {
    host: REDIS_HOST,
    port: Number(REDIS_PORT ?? 6379),
    password: REDIS_PASSWORD,
    db: Number(REDIS_DB ?? 0),
    username: REDIS_USERNAME,
  };
}
