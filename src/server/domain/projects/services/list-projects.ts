// # 查询个人项目列表：按更新时间倒序，含文件夹筛选 + 名称/简介搜索 + 分页

import prisma from "@/shared/db";
import type { ProjectListVo } from "@/shared/lib/zod/schemas/project";

// 列表查询参数（与 ProjectSchemas.listDto 对齐，已由 zod 校验保证类型）
type ListParams = {
	userId: string;
	folderId?: string;
	q?: string;
	page: number;
	pageSize: number;
};

// > folderId 为 null 表示"全部"，q 对 name/description 做 OR 模糊匹配，返回 {data, total, hasMore}
export const listProjects = async ({
	userId,
	folderId,
	q,
	page,
	pageSize,
}: ListParams): Promise<ProjectListVo> => {
	const targetFolderId = folderId || null;
	const trimmedQuery = q?.trim() ?? "";

	const where = {
		ownerId: userId,
		teamId: null,
		// folderId 传了非空串才参与筛选；undefined 不筛选，"" 归一为 null（未分类）
		...(targetFolderId && { folderId: targetFolderId }),
		...(trimmedQuery && {
			OR: [
				{ name: { contains: trimmedQuery, mode: "insensitive" as const } },
				{ description: { contains: trimmedQuery, mode: "insensitive" as const } },
			],
		}),
	};

	const offset = (page - 1) * pageSize;
	const [projects, total] = await Promise.all([
		prisma.project.findMany({
			where,
			orderBy: { updatedAt: "desc" },
			select: {
				id: true,
				name: true,
				description: true,
				folderId: true,
				folder: { select: { name: true, color: true } },
				_count: { select: { docs: true } },
				createdAt: true,
				updatedAt: true,
			},
			take: pageSize,
			skip: offset,
		}),
		prisma.project.count({ where }),
	]);

	const data = projects.map((project) => ({
		id: project.id,
		name: project.name,
		description: project.description ?? "",
		folderId: project.folderId,
		folderName: project.folder?.name ?? null,
		folderColor: project.folder?.color ?? null,
		docCount: project._count.docs,
		createdAt: project.createdAt.toISOString(),
		updatedAt: project.updatedAt.toISOString(),
	}));

	// 临时调试日志（验证完删除）：写到文件，因 dev server stdout 被缓冲
	const fs = await import("node:fs");
	fs.appendFileSync(
		"/tmp/projects-debug.log",
		`[listProjects] userId=${userId} folderId=${folderId} q=${q} found=${projects.length} total=${total} data=${JSON.stringify(data.map((d) => d.name))}\n`,
	);
	return { data, total, hasMore: projects.length === pageSize };
};
