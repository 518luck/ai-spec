// # 规约 API：更新规约

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { RuleVo } from "@/shared/lib/zod/schemas/rule";

// 更新规约入参
interface UpdateRulePayload {
	name?: string;
	content?: string;
	folderId?: string | null;
}

// > 更新规约到 PUT /api/rules/[id]；非 2xx 时解析后端统一错误体并抛出
export const updateRule = async (id: string, payload: UpdateRulePayload): Promise<RuleVo> => {
	const response = await fetch(`/api/rules/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RuleVo;
};
