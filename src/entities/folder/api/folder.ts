// # 文件夹 API：查询与新建文件夹，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { FolderOption } from "@/widgets/folder-combobox";

// > 获取当前用户的文件夹列表（GET /api/folders），按资源类型过滤；非 2xx 时解析后端统一错误体并抛出
export const getFolders = async (type: string): Promise<FolderOption[]> => {
	const response = await fetch(`/api/folders?type=${encodeURIComponent(type)}`);
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as FolderOption[];
};

// > 新建文件夹（POST /api/folders），需指定归属的资源类型；成功后返回新建的文件夹选项
export const createFolder = async ({
	name,
	description,
	color,
	resourceType,
}: {
	name: string;
	description?: string;
	color?: string;
	resourceType: string;
}): Promise<FolderOption> => {
	const response = await fetch("/api/folders", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, description, color, resource_type: resourceType }),
	});
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as FolderOption;
};
