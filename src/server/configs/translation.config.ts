// # 翻译队列配置：批大小、块切分、worker 并发、自动续跑、定时调度
// > 腾讯 TextTranslate 默认约 5 次/秒；出站 QPS/并发由 tencent-client 内 Bottleneck 控制

// 单 job 最多拉取多少条待译（本地短路径 + 送 API 合计）
export const TRANSLATION_BATCH_LIMIT = Math.max(
	1,
	Number(process.env.TRANSLATION_BATCH_LIMIT) || 100,
);

// 每块交给 provider 的条数（块与块串行，避免叠乘并发打爆 TMT 限频）
export const TRANSLATION_CHUNK_SIZE = Math.max(1, Number(process.env.TRANSLATION_CHUNK_SIZE) || 40);

// translation worker 并发数；TMT 限频紧，默认 1，靠 provider 内并发吃满约 5 次/秒
export const TRANSLATION_CONCURRENCY = Math.max(
	1,
	Number(process.env.TRANSLATION_CONCURRENCY) || 1,
);

// 本批处理后若仍有 pending/failed，是否自动再投一 intern job 续跑
export const TRANSLATION_AUTO_CHAIN = process.env.TRANSLATION_AUTO_CHAIN !== "false";

// 定时补译 cron（BullMQ 调度，默认 UTC）；扫完广场后再跑，默认每天 05:00
// 本地测试可设 TRANSLATION_BATCH_CRON="*/5 * * * *"；设 "off" 关闭定时（仍可用 pnpm translate 手动测）
export const TRANSLATION_BATCH_CRON = process.env.TRANSLATION_BATCH_CRON || "0 5 * * *";

// 是否启用定时补译（"off" / "false" 关闭；其余走 TRANSLATION_BATCH_CRON）
export const TRANSLATION_BATCH_CRON_ENABLED = !["off", "false"].includes(
	TRANSLATION_BATCH_CRON.trim().toLowerCase(),
);
