// # 用户资料 API：部分字段更新 PATCH /api/user

import type * as z from "zod/v4";
import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { updateUserSchema } from "@/shared/lib/zod/schemas/user";

// PATCH /api/user 的部分更新入参类型，复用后端共享 schema 作为单一真相
type UpdateUserPayload = Partial<z.infer<typeof updateUserSchema>>;

// > 提交用户资料部分字段到 PATCH /api/user；非 2xx 时解析后端统一错误体 { error: { message } } 并抛出
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
