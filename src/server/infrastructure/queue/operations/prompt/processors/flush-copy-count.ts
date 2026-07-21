import { getAppRedis } from "@/server/infrastructure/redis/clients";
import prisma from "@/shared/db";
import type { FlushCopyCountData } from "../types";

// > 5 分钟后处理：把 Redis 缓冲的复制增量写入 DB 的 copy_count
// ! 用「先读 → UPDATE → DECRBY delta」三步，避免 UPDATE 和 DEL 之间的 INCR 丢失
// ! BullMQ 失败重试要求幂等：UPDATE 失败时 Redis 值不变，下次重试还能读到原 delta
export async function processFlushCopyCount({ recordId }: FlushCopyCountData): Promise<void> {
	const redis = getAppRedis();
	const key = `copy:record:${recordId}`;

	// 读当前缓冲值；负数兜底为 0（并发极端情况下 DECRBY 可能短暂为负）
	const raw = await redis.get(key);
	const delta = Math.max(0, Number(raw ?? 0));
	if (delta <= 0) return;

	// 落库：copy_count += delta；record 已删除时 WHERE 命中 0 行，静默无副作用
	await prisma.$executeRaw`
		UPDATE prompt."PromptRecord"
		SET copy_count = copy_count + ${delta}
		WHERE id = ${recordId}
	`;

	// 反向减掉已落库的 delta，而不是 DEL：UPDATE 和 DECRBY 之间的 INCR 不会丢失
	// 若 DECRBY 后残留 0 或极小负数，下次 INCR 自然修正；key 1 小时后自动过期
	await redis.decrby(key, delta);
}
