// # 新建项目：个人空间落库（teamId 始终 null），事务内同步创建根文件夹，复用 getById 返回完整 Vo

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
	// 项目与根文件夹（parentId=null，name 与项目名一致）同事务创建：文件树第一行与顶层挂载点
	const project = await prisma.$transaction(async (tx) => {
		const created = await tx.project.create({
			data: {
				name,
				description: description || null,
				folderId: folderId || null,
				ownerId: userId,
				teamId: null,
			},
			select: { id: true },
		});
		await tx.projectFolder.create({
			data: { name, parentId: null, projectId: created.id },
		});
		return created;
	});
	// 复用 getById 返回完整 Vo（含 folderName/folderColor/agentsMdCount），避免手写关联拼装
	return getProjectById({ userId, id: project.id });
};
