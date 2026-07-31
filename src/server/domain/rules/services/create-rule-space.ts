// # 新建规约领域空间：同名直接拒绝，排序追加到末尾

import { AiSpecError } from "@/server/errors/http-error";
import { DEFAULT_RULE_SPACE_COLOR, DEFAULT_RULE_SPACE_ICON } from "@/server/utils/rule-space";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { RuleSpaceVo } from "@/shared/lib/zod/schemas/rule-space";

export const createRuleSpace = async ({
	userId,
	name,
	icon = DEFAULT_RULE_SPACE_ICON,
	color = DEFAULT_RULE_SPACE_COLOR,
}: {
	userId: string;
	name: string;
	icon?: string;
	color?: string;
}): Promise<RuleSpaceVo> => {
	const duplicated = await prisma.ruleSpace.findFirst({
		where: { ownerId: userId, teamId: null, name },
		select: { id: true },
	});
	if (duplicated) {
		throw new AiSpecError({ code: ErrorCode.CONFLICT, message: "已有同名空间，换个名字吧" });
	}

	// 排序值取现有空间数量，新空间排在末尾
	const sortOrder = await prisma.ruleSpace.count({
		where: { ownerId: userId, teamId: null },
	});

	return prisma.ruleSpace.create({
		data: { name, icon, color, sortOrder, ownerId: userId, teamId: null },
		select: { id: true, name: true, icon: true, color: true, sortOrder: true },
	});
};
