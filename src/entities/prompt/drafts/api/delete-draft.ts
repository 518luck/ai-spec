// # 草稿 API：删除草稿，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";

// > 删除草稿（DELETE /api/prompt/drafts/[id]）；非 2xx 时解析后端统一错误体并抛出
export const deleteDraft = async (id: string): Promise<void> => {
	const response = await fetch(`/api/prompt/drafts/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
};
