import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { calculateDiff, serializeDiff } from "@/shared/lib/diff";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import {
	createRecordVoSchema,
	recordContentVoSchema,
	updateRecordDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/record";
import { mapTags } from "../lib/map-tags";

// # 单条收录详情：全文拉取 / 部分更新，归属隔离统一走 ownerId 进 where

// > 按 id 获取收录全文（where 含 ownerId 防止越权读取他人收录）
export const GET = withPersonal(
	async ({ ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		const record = await prisma.promptRecord.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				content: true,
				folderId: true,
				tags: { include: { tag: true } },
				ownerId: true,
			},
		});

		// 收录不存在或不是当前用户所有，统一返回 404（避免暴露资源归属）
		if (!record || record.ownerId !== session.user.id) {
			throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "收录不存在" });
		}

		// ownerId 仅用于权限校验，不返回给前端；folderId 直接透传 null；tags 关联映射为扁平 {id,name,color,resourceType} 数组
		const { ownerId: _ownerId, ...rest } = record;
		const result = recordContentVoSchema.safeParse({
			...rest,
			tags: mapTags(rest.tags),
		});
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptRecord.read"] },
);

// > 部分更新收录：id 走路径，body 字段全部可选；where 含 ownerId 防止越权修改他人收录。保存时自动创建版本记录
export const PATCH = withPersonal(
	async ({ req, ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		const parsed = updateRecordDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { name, content, images, folderId, tags, message } = parsed.data;

		// > 获取当前收录内容，用于计算 diff
		const currentRecord = await prisma.promptRecord.findUnique({
			where: { id, ownerId: session.user.id },
			select: { name: true, content: true },
		});

		if (!currentRecord) {
			throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "收录不存在" });
		}

		// 构建部分更新数据：只更新传入的字段
		const data: Record<string, unknown> = {};
		if (name !== undefined) data.name = name;
		if (content !== undefined) data.content = content;
		if (images !== undefined) data.images = images;
		// folderId 收到 null/"" 表示清空为未分类（落到 DB 的 NULL），收到有效字符串表示归属该文件夹
		if (folderId !== undefined) data.folderId = folderId || null;
		// 标签关联全量替换：tags === undefined 时不动
		// ! 不能用 set：PromptRecordTag 是复合主键 (recordId, tagId)，set 要求 unique 定位，会报 P2009
		// ! deleteMany + create 必须放进事务：否则中途失败会丢标签（旧关联已删、新关联未建）
		if (tags !== undefined) {
			data.tags = { create: tags.map((tagId) => ({ tagId })) };
		}

		// > 计算新旧内容的 diff
		const newContent = content ?? currentRecord.content;
		const hasContentChange = name !== undefined || content !== undefined;

		// > 事务保证原子性：deleteMany + update（含 tags.create）+ 版本记录创建要么全成要么全败
		// ownerId 进 where 做归属隔离；记录不存在或不属于当前用户时抛 P2025 → 404
		const updated = await prisma.$transaction(async (tx) => {
			if (tags !== undefined) {
				await tx.promptRecordTag.deleteMany({ where: { recordId: id } });
			}

			// > 如果有内容变更，创建版本记录
			if (hasContentChange) {
				// 获取最新版本号
				const latestVersion = await tx.promptRecordVersion.findFirst({
					where: { recordId: id },
					orderBy: { versionNumber: "desc" },
					select: { versionNumber: true },
				});

				const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
				// 每 10 个版本存一次快照锚点；v1 强制为快照，保证任意版本都能向前找到基准
				const isSnapshot = nextVersionNumber === 1 || nextVersionNumber % 10 === 0;

				// 计算 diff
				const diff = calculateDiff({
					oldText: currentRecord.content,
					newText: newContent,
				});

				// 创建版本记录
				await tx.promptRecordVersion.create({
					data: {
						recordId: id,
						editorId: session.user.id,
						versionNumber: nextVersionNumber,
						message: message ?? null,
						isSnapshot,
						snapshot: isSnapshot ? newContent : null,
						diff: isSnapshot ? null : serializeDiff(diff),
					},
				});
			}

			return tx.promptRecord.update({
				where: { id, ownerId: session.user.id },
				data,
				select: {
					id: true,
					name: true,
					content: true,
					visibility: true,
					folderId: true,
					tags: { include: { tag: true } },
					updatedAt: true,
				},
			});
		});

		// updatedAt 由 Date 转 ISO 字符串，folderId 直接透传 null；tags 关联记录映射为扁平 {id,name,color} 数组
		const result = createRecordVoSchema.safeParse({
			...updated,
			tags: mapTags(updated.tags),
			updatedAt: updated.updatedAt.toISOString(),
		});
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptRecord.write"] },
);
