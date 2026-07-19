// # 收录 API：查询当前用户收录列表，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { ListRecordsDto, RecordListVo } from "@/shared/lib/zod/schemas/prompt/record";

// > 查询收录列表（GET /api/prompt/records），按文件夹筛选 + 分页；非 2xx 时解析后端统一错误体并抛出
export const getRecords = async (params: ListRecordsDto = {}): Promise<RecordListVo> => {
	const qs = new URLSearchParams();
	if (params.folderId) qs.set("folderId", params.folderId);
	if (params.offset !== undefined) qs.set("offset", String(params.offset));

	const response = await fetch(`/api/prompt/records?${qs.toString()}`);
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RecordListVo;
};
