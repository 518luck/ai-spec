// # 标签 API：查询全局列表与新建（同名复用），统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { CreateTagDto, TagListVo, TagOptionVo } from "@/shared/lib/zod/schemas/tag";

// > 获取全局标签列表（GET /api/tags），按 name 字母序；非 2xx 时解析后端统一错误体并抛出
export const getTags = async (): Promise<TagListVo> => {
	const response = await fetch("/api/tags");
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as TagListVo;
};

// > 新建/复用标签（POST /api/tags），同名时后端复用并更新颜色；成功后返回标签
export const createTag = async ({ name, color }: CreateTagDto): Promise<TagOptionVo> => {
	const response = await fetch("/api/tags", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, ...(color !== undefined && { color }) }),
	});
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as TagOptionVo;
};
