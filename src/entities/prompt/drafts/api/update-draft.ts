// # 草稿 API：更新草稿，统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { CreateDraftVo, UpdateDraftDto } from "@/shared/lib/zod/schemas/prompt/draft";

// 更新草稿入参：id 走 URL 路径，body 只包含需要更新的字段
export type UpdateDraftArgs = { id: string } & UpdateDraftDto;

// > 更新草稿（PATCH /api/prompt/drafts/[id]）；非 2xx 时解析后端统一错误体并抛出
export const updateDraft = async ({ id, ...payload }: UpdateDraftArgs): Promise<CreateDraftVo> => {
	const response = await fetch(`/api/prompt/drafts/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	const data = (await response.json()) as CreateDraftVo;
	return data;
};
