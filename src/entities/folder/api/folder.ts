// # 文件夹 API：查询与新建文件夹，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type {
	CreateFolderDto,
	FolderListVo,
	FolderOptionVo,
} from "@/shared/lib/zod/schemas/folder";

type GetFoldersOptions = {
	// 文件夹归属的资源类型（如 promptDraft、rules）
	type: string;
	// 规约领域空间 id；仅规约文件夹需要，传了只返回该空间下的文件夹
	spaceId?: string;
};

// > 获取当前用户的文件夹列表（GET /api/folders），按资源类型 + 领域空间过滤；非 2xx 时解析后端统一错误体并抛出
export const getFolders = async ({ type, spaceId }: GetFoldersOptions): Promise<FolderListVo> => {
	const searchParams = new URLSearchParams({ type });
	if (spaceId) searchParams.set("spaceId", spaceId);

	const response = await fetch(`/api/folders?${searchParams.toString()}`);
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as FolderListVo;
};

// > 新建文件夹（POST /api/folders），需指定归属的资源类型；规约文件夹可再指定领域空间，省略走个人默认空间
export const createFolder = async ({
	name,
	description,
	color,
	resourceType,
	spaceId,
}: CreateFolderDto): Promise<FolderOptionVo> => {
	const response = await fetch("/api/folders", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, description, color, resourceType, spaceId }),
	});
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as FolderOptionVo;
};
