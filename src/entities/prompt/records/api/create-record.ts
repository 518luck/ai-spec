// # 收录 API：提交 prompt 收录到后端，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { CreateRecordDto, CreateRecordVo } from "@/shared/lib/zod/schemas/prompt/record";

// > 提交收录到 POST /api/prompt/records；非 2xx 时解析后端统一错误体 { error: { message } } 并抛出
export const createRecord = async (payload: CreateRecordDto): Promise<CreateRecordVo> => {
	const response = await fetch("/api/prompt/records", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as CreateRecordVo;
};
