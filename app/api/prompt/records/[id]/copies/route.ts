import { NextResponse } from "next/server";
import { enqueueFlushCopyCount } from "@/server/infrastructure/queue";
import { getAppRedis } from "@/server/infrastructure/redis/clients";
import { withPersonal } from "@/server/middleware/with-personal";

// > 记录一次复制使用：Redis INCR + 入队 5 分钟后批量落库（不阻塞请求，不查 DB）
// > 用户能拿到 record_id 说明已通过 GET 鉴权；本接口不再校验归属，避免查 DB
export const POST = withPersonal(
	async ({ ctx }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		const redis = getAppRedis();
		const key = `copy:record:${id}`;

		// INCR + 设置 1 小时 TTL（NX 模式：只在 key 没有过期时间时设，避免每次刷新 TTL）
		// ! 不校验 record 是否存在/属于用户：UPDATE 落库时 WHERE id 命中 0 行静默无副作用
		await redis.pipeline().incr(key).expire(key, 3600, "NX").exec();

		// 入队 5 分钟后落库；jobId 按 recordId 去重，同 record 窗口内只入队一次
		await enqueueFlushCopyCount({ recordId: id });

		return NextResponse.json({ success: true });
	},
	{ permissions: ["promptRecord.read"] },
);
