// # 收录 API：更新收录，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { CreateRecordVo, UpdateRecordDto } from "@/shared/lib/zod/schemas/prompt/record";

// > 更新收录（PATCH /api/prompt/records）；非 2xx 时解析后端统一错误体并抛出
export const updateRecord = async (payload: UpdateRecordDto): Promise<CreateRecordVo> => {
	// ! folderId 为 undefined 时 JSON.stringify 会丢弃该字段，后端 PATCH 据此判定"不更新"，导致无法把已分类收录改回未分类；显式转 null，让"未分类"能通过 JSON 传输并落库
	const body: UpdateRecordDto = { ...payload, folderId: payload.folderId ?? null };
	const response = await fetch("/api/prompt/records", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	const data = (await response.json()) as CreateRecordVo;
	return data;
};
