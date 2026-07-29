// # 规约 API：批量删除规约

import { resolveErrorMessage } from "@/entities/lib/fetch-error";

// > 批量删除到 DELETE /api/rules/batch，一次网络往返完成
export const deleteRules = async (ids: string[]): Promise<void> => {
	const response = await fetch("/api/rules/batch", {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ids }),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
};
