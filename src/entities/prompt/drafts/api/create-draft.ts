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

// 从错误响应中提取后端统一错误体 { error: { message } }；非 JSON 或无 message 时返回空串，交由调用方决定最终文案
const resolveErrorMessage = async (response: Response): Promise<string> => {
	try {
		const body = (await response.json()) as { error?: { message?: unknown } };
		if (typeof body.error?.message === "string" && body.error.message) {
			return body.error.message;
		}
	} catch {
		// 非 JSON 响应（网关错误页等），返回空串交由调用方兜底
	}
	return "";
};
