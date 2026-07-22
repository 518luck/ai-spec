// # 版本回滚：回滚到指定版本并创建新版本记录

import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import {
	calculateDiff,
	deserializeDiff,
	reconstructContent,
	serializeDiff,
} from "@/shared/lib/diff";
import { rollbackVersionVoSchema } from "@/shared/lib/zod/schemas/prompt/record";

// > 回滚到指定版本
export const POST = withPersonal(
	async ({ ctx, session }) => {
		const { id: rawId, versionId: rawVersionId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;
		const versionId = Array.isArray(rawVersionId) ? rawVersionId[0] : rawVersionId;

		// > 获取收录当前内容
		const record = await prisma.promptRecord.findUnique({
			where: { id, ownerId: session.user.id },
			select: { name: true, content: true },
		});

		if (!record) {
			throw new AiSpecError({ code: "NOT_FOUND", message: "收录不存在" });
		}

		// > 获取目标版本
		const targetVersion = await prisma.promptRecordVersion.findUnique({
			where: { id: versionId, recordId: id },
			select: {
				versionNumber: true,
				isSnapshot: true,
				snapshot: true,
				diff: true,
			},
		});

		if (!targetVersion) {
			throw new AiSpecError({ code: "NOT_FOUND", message: "版本不存在" });
		}

		// > 重建目标版本的完整内容
		let targetContent: string;

		if (targetVersion.isSnapshot && targetVersion.snapshot) {
			targetContent = targetVersion.snapshot;
		} else {
			// 找到目标版本之前最近的快照
			const nearestSnapshot = await prisma.promptRecordVersion.findFirst({
				where: {
					recordId: id,
					isSnapshot: true,
					versionNumber: { lte: targetVersion.versionNumber },
				},
				orderBy: { versionNumber: "desc" },
				select: {
					versionNumber: true,
					snapshot: true,
				},
			});

			if (!nearestSnapshot?.snapshot) {
				throw new AiSpecError({
					code: "INTERNAL_ERROR",
					message: "无法重建版本：找不到基准快照",
				});
			}

			// 获取从快照到目标版本之间的所有 diff
			const diffs = await prisma.promptRecordVersion.findMany({
				where: {
					recordId: id,
					versionNumber: {
						gt: nearestSnapshot.versionNumber,
						lte: targetVersion.versionNumber,
					},
				},
				orderBy: { versionNumber: "asc" },
				select: { diff: true },
			});

			targetContent = reconstructContent({
				snapshot: nearestSnapshot.snapshot,
				diffs: diffs.filter((d) => d.diff !== null).map((d) => deserializeDiff(d.diff as string)),
			});
		}

		// > 在事务中更新收录并创建新版本记录
		const updated = await prisma.$transaction(async (tx) => {
			// 获取最新版本号
			const latestVersion = await tx.promptRecordVersion.findFirst({
				where: { recordId: id },
				orderBy: { versionNumber: "desc" },
				select: { versionNumber: true },
			});

			const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
			const isSnapshot = nextVersionNumber % 10 === 0;

			// 计算从当前内容到目标内容的 diff
			const diff = calculateDiff({
				oldText: record.content,
				newText: targetContent,
			});

			// 创建回滚版本记录
			await tx.promptRecordVersion.create({
				data: {
					recordId: id,
					editorId: session.user.id,
					versionNumber: nextVersionNumber,
					message: `回滚到 v${targetVersion.versionNumber}`,
					isSnapshot,
					snapshot: isSnapshot ? targetContent : null,
					diff: isSnapshot ? null : serializeDiff(diff),
				},
			});

			// 更新收录内容
			return tx.promptRecord.update({
				where: { id, ownerId: session.user.id },
				data: { content: targetContent },
				select: {
					id: true,
					name: true,
					content: true,
					updatedAt: true,
				},
			});
		});

		// 校验出参
		const result = rollbackVersionVoSchema.safeParse({
			id: updated.id,
			name: updated.name,
			content: updated.content,
			updatedAt: updated.updatedAt.toISOString(),
		});
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptRecord.write"] },
);
