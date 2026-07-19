import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import {
	createTagDtoSchema,
	tagListVoSchema,
	tagOptionVoSchema,
} from "@/shared/lib/zod/schemas/tag";

// # 全局标签：列表查询与新建（name 全局唯一，同名复用并更新颜色）

// > 查询全局标签列表（Tag 是共享字典，无 owner 隔离）；按 name 字母序返回
export const GET = withPersonal(async () => {
	const tags = await prisma.tag.findMany({
		orderBy: [{ name: "asc" }],
		select: { id: true, name: true, color: true },
	});

	const parsed = tagListVoSchema.safeParse(tags);
	if (!parsed.success) {
		throw parsed.error;
	}

	return NextResponse.json(parsed.data);
});

// > 新建标签：按 name upsert，同名时复用 id 并更新 color（全局共享语义）
export const POST = withPersonal(async ({ req }) => {
	const parsed = createTagDtoSchema.safeParse(await req.json());
	if (!parsed.success) {
		throw parsed.error;
	}

	const { name, color } = parsed.data;

	// upsert：name 已存在则复用（并更新 color），不存在则新建（color 缺省走 DB 默认值）
	const tag = await prisma.tag.upsert({
		where: { name },
		update: { ...(color !== undefined && { color }) },
		create: { name, ...(color !== undefined && { color }) },
		select: { id: true, name: true, color: true },
	});

	const result = tagOptionVoSchema.safeParse(tag);
	if (!result.success) {
		throw result.error;
	}

	return NextResponse.json(result.data, { status: 201 });
});
