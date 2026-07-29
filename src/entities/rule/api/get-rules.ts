// # 规约列表 API：从后端获取规约列表

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { ListRulesDto, RuleListVo } from "@/shared/lib/zod/schemas/rule";

// > 从 GET /api/rules 获取规约列表；非 2xx 时解析后端统一错误体并抛出
export const getRules = async (params?: ListRulesDto): Promise<RuleListVo> => {
	const searchParams = new URLSearchParams();
	if (params?.folderId) searchParams.set("folderId", params.folderId);
	if (params?.spaceId) searchParams.set("spaceId", params.spaceId);
	if (params?.tagIds) searchParams.set("tagIds", params.tagIds);
	if (params?.q) searchParams.set("q", params.q);
	if (params?.offset !== undefined) searchParams.set("offset", String(params.offset));
	if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));

	const url = `/api/rules${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RuleListVo;
};
