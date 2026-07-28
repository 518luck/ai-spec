import { NextResponse } from "next/server";

import { createDiscoverSkillReport } from "@/server/domain/discover/skills";
import { AiSpecError } from "@/server/errors/http-error";
import { ratelimit } from "@/server/infrastructure/redis/reatlimit";
import { withPersonal } from "@/server/middleware/with-personal";
import {
	reportDiscoverSkillDtoSchema,
	reportDiscoverSkillVoSchema,
} from "@/shared/lib/zod/schemas/discover-skill";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

// # 发现广场：对单个 skill 提交反馈（只收集，不自动下架）

// > POST /api/discover/skills/:id/report — 原因 + 可选备注；同一用户同一 skill 仅一次
export const POST = withPersonal(
	async ({ req, ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const skillId = Array.isArray(rawId) ? rawId[0] : rawId;
		if (!skillId) {
			throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "该 skill 不存在或已下架" });
		}

		const parsed = reportDiscoverSkillDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}

		// 防刷：每用户 60 秒内最多 10 次反馈提交
		try {
			await ratelimit({ key: `discover-skill-report:${session.user.id}` });
		} catch (error) {
			throw new AiSpecError({
				code: ErrorCode.RATE_LIMITED,
				message: error instanceof Error ? error.message : "请求过于频繁，请稍后再试",
			});
		}

		const vo = await createDiscoverSkillReport({
			skillId,
			reporterId: session.user.id,
			reason: parsed.data.reason,
			detail: parsed.data.detail,
		});

		const result = reportDiscoverSkillVoSchema.safeParse(vo);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data, { status: 201 });
	},
	{ permissions: ["discover.read"] },
);
