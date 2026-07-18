// # 收录 API：更新收录，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { CreateRecordVo, UpdateRecordDto } from "@/shared/lib/zod/schemas/prompt/record";

// > 更新收录（PATCH /api/prompt/records）；非 2xx 时解析后端统一错误体并抛出
export const updateRecord = async (payload: UpdateRecordDto): Promise<CreateRecordVo> => {
	const response = await fetch("/api/prompt/records", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	const data = (await response.json()) as CreateRecordVo;
	return data;
};
