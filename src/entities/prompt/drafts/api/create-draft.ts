import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { CreateDraftDto, CreateDraftVo } from "@/shared/lib/zod/schemas/prompt/draft";

// 提交草稿到 POST /api/prompt/drafts；非 2xx 时解析后端统一错误体 { error: { message } } 并抛出
export const createDraft = async (payload: CreateDraftDto): Promise<CreateDraftVo> => {
	const response = await fetch("/api/prompt/drafts", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as CreateDraftVo;
};
