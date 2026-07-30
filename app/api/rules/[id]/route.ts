import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import { calculateDiff, serializeDiff } from "@/server/utils/diff";
import { mapTags } from "@/server/utils/map-tags";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import {
	ruleContentVoSchema,
	ruleVoSchema,
	updateRuleDtoSchema,
} from "@/shared/lib/zod/schemas/rule";

// # 单条规约：查看详情、更新、删除

// 获取单条规约详情：返回全文 + tags（编辑回填用）
export const GET = withPersonal(async ({ ctx, session }) => {
	const { id: rawId } = await ctx.params;
	const id = Array.isArray(rawId) ? rawId[0] : rawId;

	const rule = await prisma.rule.findFirst({
		where: {
			id,
			ownerId: session.user.id,
		},
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

	// 扁平化标签关联
	const out = {
		...rule,
		tags: mapTags(rule.tags),
	};

	const result = ruleContentVoSchema.safeParse(out);
	if (!result.success) {
		throw result.error;
	}

	return NextResponse.json(result.data);
});

// 更新规约：部分更新，tags 全量替换（事务保证原子性）
export const PUT = withPersonal(async ({ req, ctx, session }) => {
	const { id: rawId } = await ctx.params;
	const id = Array.isArray(rawId) ? rawId[0] : rawId;

	const parsed = updateRuleDtoSchema.safeParse(await req.json());
	if (!parsed.success) {
		throw parsed.error;
	}
	const { name, content, folderId, tags } = parsed.data;

	// 验证规约是否存在且属于当前用户；取 content 用于计算版本 diff
	const existingRule = await prisma.rule.findFirst({
		where: {
			id,
			ownerId: session.user.id,
		},
		select: {
			content: true,
		},
	});

	if (!existingRule) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "规约不存在" });
	}

	// 目标文件夹：换文件夹时用它的领域空间校正规约归属
	const targetFolder = folderId
		? await prisma.folder.findFirst({
				where: { id: folderId, ownerId: session.user.id },
				select: { ruleSpaceId: true },
			})
		: null;
	if (folderId && !targetFolder) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "文件夹不存在" });
	}

	// 构建部分更新数据：只更新传入的字段
	const data: {
		name?: string;
		content?: string;
		folderId?: string | null;
		spaceId?: string;
		tags?: { create: { tagId: string }[] };
	} = {};
	if (name !== undefined) data.name = name;
	if (content !== undefined) data.content = content;
	// folderId 收到 null/"" 表示清空为未分类（落到 DB 的 NULL），收到有效字符串表示归属该文件夹
	if (folderId !== undefined) data.folderId = folderId || null;
	// ! 移入其他空间的文件夹时 spaceId 必须跟着走，否则规约会滞留在原空间；清空文件夹只是变未分类，仍留在原空间
	if (targetFolder?.ruleSpaceId) data.spaceId = targetFolder.ruleSpaceId;
	// 标签关联全量替换：tags === undefined 时不动
	// ! 不能用 set：RuleTag 是复合主键 (ruleId, tagId)，set 要求 unique 定位，会报 P2009
	// ! deleteMany + create 必须放进事务：否则中途失败会丢标签（旧关联已删、新关联未建）
	if (tags !== undefined) {
		data.tags = { create: tags.map((tagId) => ({ tagId })) };
	}

	// > 版本记录：name 或 content 变更时建版本（folder/tags/space 变更不建版本）
	const newContent = content ?? existingRule.content;
	const hasContentChange = name !== undefined || content !== undefined;

	// > 事务保证原子性：deleteMany + update（含 tags.create）+ 版本记录创建要么全成要么全败
	// ownerId 进 where 做归属隔离；记录不存在或不属于当前用户时抛 P2025 → 404
	const rule = await prisma.$transaction(async (tx) => {
		if (tags !== undefined) {
			await tx.ruleTag.deleteMany({ where: { ruleId: id } });
		}

		// > 如果有内容变更，创建版本记录（混合 diff：每 10 版存一次全量快照，其余存增量 diff）
		if (hasContentChange) {
			const latestVersion = await tx.ruleVersion.findFirst({
				where: { ruleId: id },
				orderBy: { versionNumber: "desc" },
				select: { versionNumber: true },
			});

			const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
			// v1 强制快照，其后每 10 版存一次快照锚点，保证任意版本都能向前找到基准
			const isSnapshot = nextVersionNumber === 1 || nextVersionNumber % 10 === 0;

			// 计算 diff（新内容相对当前内容）
			const diff = calculateDiff({
				oldText: existingRule.content,
				newText: newContent,
			});

			await tx.ruleVersion.create({
				data: {
					ruleId: id,
					editorId: session.user.id,
					versionNumber: nextVersionNumber,
					isSnapshot,
					snapshot: isSnapshot ? newContent : null,
					diff: isSnapshot ? null : serializeDiff(diff),
				},
			});
		}

		return tx.rule.update({
			where: { id, ownerId: session.user.id },
			data,
			select: {
				id: true,
				name: true,
				content: true,
				folderId: true,
				tags: { include: { tag: true } },
				createdAt: true,
				updatedAt: true,
			},
		});
	});

	// 转换时间格式 + 扁平化标签关联
	const out = {
		...rule,
		tags: mapTags(rule.tags),
		createdAt: rule.createdAt.toISOString(),
		updatedAt: rule.updatedAt.toISOString(),
	};

	const result = ruleVoSchema.safeParse(out);
	if (!result.success) {
		throw result.error;
	}

	return NextResponse.json(result.data);
});

// 删除规约
export const DELETE = withPersonal(async ({ ctx, session }) => {
	const { id: rawId } = await ctx.params;
	const id = Array.isArray(rawId) ? rawId[0] : rawId;

	// 验证规约是否存在且属于当前用户
	const existingRule = await prisma.rule.findFirst({
		where: {
			id,
			ownerId: session.user.id,
		},
	});

	if (!existingRule) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "规约不存在" });
	}

	// 删除规约
	await prisma.rule.delete({
		where: { id },
	});

	return NextResponse.json({ success: true });
});
