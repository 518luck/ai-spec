// # Discover skills 扫描调度常量

// 连续失败达到该次数的货源置 dormant（休眠后每周试探，成功自动复活）
export const SOURCE_FAIL_THRESHOLD = 5;

// 广场每日扫描的 cron 表达式（BullMQ 调度，默认按 UTC 时区）
// 本地测试可设 DISCOVER_SCAN_CRON="*/1 * * * *"（每分钟触发）；生产留空走默认 04:00
export const DISCOVER_SCAN_CRON = process.env.DISCOVER_SCAN_CRON || "0 4 * * *";
