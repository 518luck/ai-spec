import type * as z from "zod/v4";
import type { updateUserSchema } from "@/shared/lib/zod/schemas/user";

// PATCH /api/user 的部分更新入参类型，复用后端共享 schema 作为单一真相
type UpdateUserPayload = Partial<z.infer<typeof updateUserSchema>>;

// 提交用户资料部分字段到 PATCH /api/user；非 2xx 时解析后端统一错误体 { error: { message } } 并抛出
export const updateUser = async (payload: UpdateUserPayload): Promise<void> => {
	const response = await fetch("/api/user", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
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
