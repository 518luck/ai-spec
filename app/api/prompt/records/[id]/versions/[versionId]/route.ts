// # 版本详情：获取特定版本的完整内容（从快照重建）

import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { deserializeDiff, reconstructContent } from "@/shared/lib/diff";
import { versionDetailVoSchema } from "@/shared/lib/zod/schemas/prompt/record";

// > 获取版本详情：重建该版本的完整内容
export const GET = withPersonal(
	async ({ ctx, session }) => {
		const { id: rawId, versionId: rawVersionId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;
		const versionId = Array.isArray(rawVersionId) ? rawVersionId[0] : rawVersionId;

		// > 验证收录存在且归属当前用户，同时取 name 作为版本详情的标题
		const record = await prisma.promptRecord.findUnique({
			where: { id },
			select: { ownerId: true, name: true },
		});

		if (!record || record.ownerId !== session.user.id) {
			throw new AiSpecError({ code: "NOT_FOUND", message: "收录不存在" });
		}

		// > 获取目标版本
		const targetVersion = await prisma.promptRecordVersion.findUnique({
			where: { id: versionId, recordId: id },
			select: {
				id: true,
				versionNumber: true,
				message: true,
				isSnapshot: true,
				snapshot: true,
				diff: true,
				createdAt: true,
				editor: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		});

		if (!targetVersion) {
			throw new AiSpecError({ code: "NOT_FOUND", message: "版本不存在" });
		}

		// > 重建完整内容
		let content: string;

		if (targetVersion.isSnapshot && targetVersion.snapshot) {
			// 快照版本直接返回
			content = targetVersion.snapshot;
		} else {
			// 增量版本：从最近的快照开始重建
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

			// 获取重建所需的所有 diff：区间 (nearestSnapshot, target] 左开右闭——
			// 起点快照无 diff 不拉；终点目标必拉（重建它需要它自己的说明书）
			// > orderBy 必须 asc：说明书按版本号顺序逐张套用，倒序会让后续 diff 错套到旧内容上
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

			// 应用所有 diff 重建内容
			content = reconstructContent({
				snapshot: nearestSnapshot.snapshot,
				diffs: diffs.filter((d) => d.diff !== null).map((d) => deserializeDiff(d.diff as string)),
			});
		}

		// 校验出参
		const result = versionDetailVoSchema.safeParse({
			id: targetVersion.id,
			versionNumber: targetVersion.versionNumber,
			message: targetVersion.message,
			isSnapshot: targetVersion.isSnapshot,
			name: record.name,
			content,
			createdAt: targetVersion.createdAt.toISOString(),
			editor: targetVersion.editor,
		});
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptRecord.read"] },
);
