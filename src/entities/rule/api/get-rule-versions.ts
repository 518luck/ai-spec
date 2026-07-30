// # 规约版本历史 API：获取版本列表

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { VersionListVo } from "@/shared/lib/zod/schemas/prompt/record";

// > 获取规约版本历史列表（page 为 1-based 页码）
export const getRuleVersions = async ({
	ruleId,
	page = 1,
	pageSize = 20,
}: {
	ruleId: string;
	page?: number;
	pageSize?: number;
}): Promise<VersionListVo> => {
	const params = new URLSearchParams({
		page: String(page),
		pageSize: String(pageSize),
	});

	const response = await fetch(`/api/rules/${ruleId}/versions?${params}`);

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as VersionListVo;
};
