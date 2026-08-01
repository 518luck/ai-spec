// # 新建项目：个人空间落库（teamId 始终 null），复用 getById 返回完整 Vo

import prisma from "@/shared/db";
import type { ProjectVo } from "@/shared/lib/zod/schemas/project";
import { getProjectById } from "./get-project-by-id";

export const createProject = async ({
	userId,
	name,
	description,
	folderId,
}: {
	userId: string;
	name: string;
	description?: string | null;
	folderId?: string | null;
}): Promise<ProjectVo> => {
	const project = await prisma.project.create({
		data: {
			name,
			description: description || null,
			folderId: folderId || null,
			ownerId: userId,
			teamId: null,
		},
		select: { id: true },
	});
	// 复用 getById 返回完整 Vo（含 folderName/folderColor/docCount），避免手写关联拼装
	return getProjectById({ userId, id: project.id });
};
