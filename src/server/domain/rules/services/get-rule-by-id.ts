// # 规约单条详情：返回全文 + tags（编辑回填用）

import { AiSpecError } from "@/server/errors/http-error";
import { mapTags } from "@/server/utils/map-tags";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { RuleContentVo } from "@/shared/lib/zod/schemas/rule";

export const getRuleById = async ({
	userId,
	id,
}: {
	userId: string;
	id: string;
}): Promise<RuleContentVo> => {
	const rule = await prisma.rule.findFirst({
		where: { id, ownerId: userId },
		select: {
			id: true,
			name: true,
			content: true,
			folderId: true,
			tags: { include: { tag: true } },
		},
	});
	if (!rule) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "规约不存在" });
	}
	return { ...rule, tags: mapTags(rule.tags) };
};
