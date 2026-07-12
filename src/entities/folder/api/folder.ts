import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { FolderOption } from "@/widgets/folder-combobox";

// 获取当前用户的文件夹列表（GET /api/folders）；非 2xx 时解析后端统一错误体并抛出
export const getFolders = async (): Promise<FolderOption[]> => {
	const response = await fetch("/api/folders");
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as FolderOption[];
};

// 新建文件夹（POST /api/folders），成功后返回新建的文件夹选项
export const createFolder = async (name: string): Promise<FolderOption> => {
	const response = await fetch("/api/folders", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as FolderOption;
};
