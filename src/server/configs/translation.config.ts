// # 翻译队列配置：批大小、块切分、worker 并发、自动续跑
// > 腾讯 TextTranslate 默认约 5 次/秒且单条接口；块内并发由 tencent provider 自己限流

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
