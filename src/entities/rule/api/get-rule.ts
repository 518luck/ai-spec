// # 单条规约 API：从后端获取单条规约详情（含全文 + tags，编辑回填用）

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { RuleContentVo } from "@/shared/lib/zod/schemas/rule";

// > 从 GET /api/rules/[id] 获取单条规约详情；非 2xx 时解析后端统一错误体并抛出
export const getRule = async (id: string): Promise<RuleContentVo> => {
	const response = await fetch(`/api/rules/${id}`);

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RuleContentVo;
};
