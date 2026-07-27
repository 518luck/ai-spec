// # 规约领域空间列表 API：从后端获取当前用户的领域空间

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { RuleSpaceListVo } from "@/shared/lib/zod/schemas/rule-space";

// > 从 GET /api/rules/spaces 获取领域空间列表；非 2xx 时解析后端统一错误体并抛出
export const getRuleSpaces = async (): Promise<RuleSpaceListVo> => {
	const response = await fetch("/api/rules/spaces");

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RuleSpaceListVo;
};
