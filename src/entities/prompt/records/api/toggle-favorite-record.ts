// # 收录 API：收藏开关（加入/取消），统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { FavoriteToggleVo } from "@/shared/lib/zod/schemas/prompt/record";

// > 加入收藏（POST /api/prompt/records/[id]/favorite）；非 2xx 时解析后端统一错误体并抛出
export const favoriteRecord = async (id: string): Promise<FavoriteToggleVo> => {
	const response = await fetch(`/api/prompt/records/${id}/favorite`, {
		method: "POST",
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as FavoriteToggleVo;
};

// > 取消收藏（DELETE /api/prompt/records/[id]/favorite）；非 2xx 时解析后端统一错误体并抛出
export const unfavoriteRecord = async (id: string): Promise<FavoriteToggleVo> => {
	const response = await fetch(`/api/prompt/records/${id}/favorite`, {
		method: "DELETE",
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as FavoriteToggleVo;
};
