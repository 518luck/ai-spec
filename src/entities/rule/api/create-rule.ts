// # 规约 API：提交规约到后端，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { CreateRuleDto, RuleVo } from "@/shared/lib/zod/schemas/rule";

// > 提交规约到 POST /api/rules；非 2xx 时解析后端统一错误体 { error: { message } } 并抛出
export const createRule = async (payload: CreateRuleDto): Promise<RuleVo> => {
	const response = await fetch("/api/rules", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RuleVo;
};
