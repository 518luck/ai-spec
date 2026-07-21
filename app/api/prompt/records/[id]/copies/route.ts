import { NextResponse } from "next/server";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";

// > 记录一次复制使用：直接 UPDATE DB（copy_count + 1 + 刷新 last_copied_at）
// > 个人场景复制为低频操作，无需 Redis 缓冲或队列批量落库，直接写库零侵入
// ! 不校验 record 是否存在/属于用户：WHERE 命中 0 行静默无副作用（用户能拿到 record_id 说明已通过 GET 鉴权）
export const POST = withPersonal(
	async ({ ctx }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		// 原子自增 + 刷新时间：copy_count 用于权重，last_copied_at 驱动 HN 幂律衰减
		await prisma.promptRecord.updateMany({
			where: { id },
			data: {
				copyCount: { increment: 1 },
				lastCopiedAt: new Date(),
			},
		});

		return NextResponse.json({ success: true });
	},
	{ permissions: ["promptRecord.read"] },
);
