// # 收录 API：获取单条收录全文（卡片复制全文时用），统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { RecordContentVo } from "@/shared/lib/zod/schemas/prompt/record";

// > 获取单条收录全文（GET /api/prompt/records/[id]）；非 2xx 时解析后端统一错误体并抛出
export const getRecord = async (id: string): Promise<RecordContentVo> => {
	const response = await fetch(`/api/prompt/records/${id}`);
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RecordContentVo;
};
