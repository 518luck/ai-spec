// # Discover 广场同步配置

// 每日同步的 awesome 货源目录清单（skills 资源类型），加新源就是加一行
export const AWESOME_SOURCES = ["VoltAgent/awesome-agent-skills"] as const;

// 连续失败达到该次数的货源置 dormant（休眠后每周试探，成功自动复活）
export const SOURCE_FAIL_THRESHOLD = 5;
