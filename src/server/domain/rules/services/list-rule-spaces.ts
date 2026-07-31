// # 查询规约领域空间列表：一个都没有时先补上个人默认空间，保证列表与资源实际归属一致

import { getOrCreatePersonalRuleSpace } from "@/server/utils/rule-space";
import prisma from "@/shared/db";
import type { RuleSpaceListVo } from "@/shared/lib/zod/schemas/rule-space";

export const listRuleSpaces = async (userId: string): Promise<RuleSpaceListVo> => {
	await getOrCreatePersonalRuleSpace(userId);
	return prisma.ruleSpace.findMany({
		where: { ownerId: userId, teamId: null },
		orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
		select: { id: true, name: true, icon: true, color: true, sortOrder: true },
	});
};
