// # 标签 API：按资源类型查询列表与新建（同用户同资源同名复用），统一走 resolveErrorMessage 解析后端错误体

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { CreateTagDto, TagListVo, TagOptionVo } from "@/shared/lib/zod/schemas/tag";

// > 获取当前用户某资源类型下的标签列表（GET /api/tags?type=xxx），按 name 字母序；非 2xx 时解析后端统一错误体并抛出
export const getTags = async (resourceType: string): Promise<TagListVo> => {
	const response = await fetch(`/api/tags?type=${encodeURIComponent(resourceType)}`);
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as TagListVo;
};

// > 新建/复用标签（POST /api/tags），同用户同资源同名时后端复用并更新颜色；成功后返回标签
export const createTag = async ({
	name,
	color,
	resourceType,
}: CreateTagDto): Promise<TagOptionVo> => {
	const response = await fetch("/api/tags", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, color, resourceType }),
	});
	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}
	return (await response.json()) as TagOptionVo;
};
