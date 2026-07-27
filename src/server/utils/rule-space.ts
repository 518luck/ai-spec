// # 规约领域空间解析：规则与规约文件夹落库前，都要先确定归属的领域空间

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

// 新建空间的默认图标（前端 Icons 注册表的 key）
export const DEFAULT_RULE_SPACE_ICON = "rulesLibrary";

// 个人默认空间：用户还没建过空间时自动补一个，避免规则/文件夹无家可归
const DEFAULT_PERSONAL_SPACE = { name: "我的规约", icon: DEFAULT_RULE_SPACE_ICON } as const;

// > 获取用户的个人默认领域空间（teamId=null，取排序最靠前的一个），不存在则自动创建
export const getOrCreatePersonalRuleSpace = async (userId: string): Promise<string> => {
	const existing = await prisma.ruleSpace.findFirst({
		where: { ownerId: userId, teamId: null },
		orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
		select: { id: true },
	});

	if (existing) {
		return existing.id;
	}

	const created = await prisma.ruleSpace.create({
		data: { ...DEFAULT_PERSONAL_SPACE, ownerId: userId, teamId: null },
		select: { id: true },
	});

	return created.id;
};

type ResolveRuleSpaceIdOptions = {
	userId: string;
	// 目标空间 id；省略表示由后端回落到个人默认空间
	spaceId?: string;
};

// > 解析资源要落到的领域空间：传了 spaceId 先校验归属，没传回落个人默认空间
export const resolveRuleSpaceId = async ({
	userId,
	spaceId,
}: ResolveRuleSpaceIdOptions): Promise<string> => {
	if (!spaceId) {
		return getOrCreatePersonalRuleSpace(userId);
	}

	const space = await prisma.ruleSpace.findFirst({
		where: { id: spaceId, ownerId: userId, teamId: null },
		select: { id: true },
	});
	if (!space) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "领域空间不存在" });
	}

	return space.id;
};
