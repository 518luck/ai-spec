// # 草稿 API：查询当前用户草稿列表，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { DraftListVo } from "@/shared/lib/zod/schemas/prompt/draft";

// 草稿列表查询入参
type GetDraftsParams = {
	query?: string;
	sort?: string;
	folder?: string;
};

// > 查询草稿列表（GET /api/prompt/drafts），按搜索/排序/文件夹筛选；非 2xx 时解析后端统一错误体并抛出
export const getDrafts = async (params: GetDraftsParams = {}): Promise<DraftListVo> => {
	const qs = new URLSearchParams();
	if (params.query) qs.set("query", params.query);
	if (params.sort) qs.set("sort", params.sort);
	if (params.folder) qs.set("folder", params.folder);

	const response = await fetch(`/api/prompt/drafts?${qs.toString()}`);
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as DraftListVo;
};
