// # 单条规约 API：从后端获取单条规约详情

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { RuleVo } from "@/shared/lib/zod/schemas/rule";

// > 从 GET /api/rules/[id] 获取单条规约详情；非 2xx 时解析后端统一错误体并抛出
export const getRule = async (id: string): Promise<RuleVo> => {
	const response = await fetch(`/api/rules/${id}`);

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RuleVo;
};
