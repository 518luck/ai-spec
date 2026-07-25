// # 规约 API：删除规约

import { resolveErrorMessage } from "@/entities/lib/fetch-error";

// > 删除规约到 DELETE /api/rules/[id]；非 2xx 时解析后端统一错误体并抛出
export const deleteRule = async (id: string): Promise<void> => {
	const response = await fetch(`/api/rules/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
};
