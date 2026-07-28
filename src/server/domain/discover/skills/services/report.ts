import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { Prisma } from "@/shared/db/generator/client";
import type {
	DiscoverSkillReportReason,
	ReportDiscoverSkillVo,
} from "@/shared/lib/zod/schemas/discover-skill";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

// # Discover skill 用户反馈：只收集入库，不改 delistedAt / 列表可见性

type CreateDiscoverSkillReportOptions = {
	skillId: string;
	reporterId: string;
	reason: DiscoverSkillReportReason;
	detail?: string;
};

// > 提交一条反馈：skill 须在列表可见集内；同一用户对同一 skill 仅一次
export const createDiscoverSkillReport = async ({
	skillId,
	reporterId,
	reason,
	detail,
}: CreateDiscoverSkillReportOptions): Promise<ReportDiscoverSkillVo> => {
	// 仅允许反馈当前仍在广场展示的条目（与列表 delistedAt 过滤一致）
	const skill = await prisma.discoverSkill.findFirst({
		where: { id: skillId, delistedAt: null },
		select: { id: true },
	});
	if (!skill) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "该 skill 不存在或已下架" });
	}

	try {
		const row = await prisma.discoverSkillReport.create({
			data: {
				skillId,
				reporterId,
				reason,
				detail: detail ?? null,
			},
			select: {
				id: true,
				skillId: true,
				reason: true,
				status: true,
				createdAt: true,
			},
		});

		return {
			id: row.id,
			skillId: row.skillId,
			reason: row.reason,
			status: row.status,
			createdAt: row.createdAt.toISOString(),
		};
	} catch (error) {
		// 唯一约束：同一用户已反馈过
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			throw new AiSpecError({
				code: ErrorCode.CONFLICT,
				message: "这条你已经反馈过啦，我们收到了，谢谢",
			});
		}
		throw error;
	}
};
