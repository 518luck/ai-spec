// # 草稿 API：获取单条草稿全文（编辑时用），统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";

// > 获取单条草稿全文（GET /api/prompt/drafts/[id]）；非 2xx 时解析后端统一错误体并抛出
export const getDraft = async (
	id: string,
): Promise<{
	id: string;
	name: string | null;
	content: string;
	folderId?: string;
}> => {
	const response = await fetch(`/api/prompt/drafts/${id}`);
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as {
		id: string;
		name: string | null;
		content: string;
		folderId?: string;
	};
};
