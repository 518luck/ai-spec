import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import { DEFAULT_RULE_SPACE_ICON, getOrCreatePersonalRuleSpace } from "@/server/utils/rule-space";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import {
	createRuleSpaceDtoSchema,
	ruleSpaceListVoSchema,
	ruleSpaceVoSchema,
} from "@/shared/lib/zod/schemas/rule-space";

// # 个人空间的规约领域空间：列表查询与新建（teamId 始终为 null）
// ! 与 folders/route.ts 对称，团队空间待 defaultWorkspace 基础设施上线后接通

// > 查询当前用户的领域空间列表；一个都没有时先补上个人默认空间，保证列表与资源实际归属一致
export const GET = withPersonal(
	async ({ session }) => {
		await getOrCreatePersonalRuleSpace(session.user.id);

		const spaces = await prisma.ruleSpace.findMany({
			where: { ownerId: session.user.id, teamId: null },
			orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
			select: { id: true, name: true, icon: true, sortOrder: true },
		});

		const parsed = ruleSpaceListVoSchema.safeParse(spaces);
		if (!parsed.success) {
			throw parsed.error;
		}

		return NextResponse.json(parsed.data);
	},
	{ permissions: ["rules.read"] },
);

// > 新建领域空间：同名直接拒绝（下拉里两个同名空间分不清），排序追加到末尾
export const POST = withPersonal(
	async ({ req, session }) => {
		const parsed = createRuleSpaceDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { name, icon = DEFAULT_RULE_SPACE_ICON } = parsed.data;

		const duplicated = await prisma.ruleSpace.findFirst({
			where: { ownerId: session.user.id, teamId: null, name },
			select: { id: true },
		});
		if (duplicated) {
			throw new AiSpecError({ code: ErrorCode.CONFLICT, message: "已有同名空间，换个名字吧" });
		}

		// 排序值取现有空间数量，新空间排在末尾
		const sortOrder = await prisma.ruleSpace.count({
			where: { ownerId: session.user.id, teamId: null },
		});

		const space = await prisma.ruleSpace.create({
			data: { name, icon, sortOrder, ownerId: session.user.id, teamId: null },
			select: { id: true, name: true, icon: true, sortOrder: true },
		});

		const result = ruleSpaceVoSchema.safeParse(space);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data, { status: 201 });
	},
	{ permissions: ["rules.write"] },
);
