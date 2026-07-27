import prisma from "@/shared/db";

// # 处理器：收尾清扫——货源已休眠/消失的条目兜底下架（幂等安全网，正常路径由休眠转换时即时下架）
// > 只按货源状态判定、不按时间窗猜测：active 货源的条目永不被 sweep 触碰，杜绝停机后误下架

export async function processDiscoverSweep(): Promise<void> {
	const activeSources = await prisma.discoverSource.findMany({
		where: { kind: "repo", status: "active" },
		select: { repo: true },
	});
	await prisma.discoverSkill.updateMany({
		where: {
			delistedAt: null,
			sourceRepo: { notIn: activeSources.map(({ repo }) => repo) },
		},
		data: { delistedAt: new Date() },
	});
}
