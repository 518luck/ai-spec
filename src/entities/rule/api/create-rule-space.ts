// # 规约领域空间创建 API：新建一个顶层隔离的领域空间

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { CreateRuleSpaceDto, RuleSpaceVo } from "@/shared/lib/zod/schemas/rule-space";

// > 提交新空间到 POST /api/rules/spaces；重名等业务冲突由后端返回统一错误体，这里解析后抛出
export const createRuleSpace = async ({ name, icon }: CreateRuleSpaceDto): Promise<RuleSpaceVo> => {
	const response = await fetch("/api/rules/spaces", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, icon }),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RuleSpaceVo;
};
