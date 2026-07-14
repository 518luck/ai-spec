// # 用户资料 API：部分字段更新 PATCH /api/user

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { UpdateUserDto } from "@/shared/lib/zod/schemas/user";

// > 提交用户资料部分字段到 PATCH /api/user；非 2xx 时解析后端统一错误体 { error: { message } } 并抛出
export const updateUser = async (payload: UpdateUserDto): Promise<void> => {
	const response = await fetch("/api/user", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
};
