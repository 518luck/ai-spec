// # 发现广场列表 API：从后端获取 GitHub 索引条目

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type {
	DiscoverSkillListVo,
	ListDiscoverSkillsDto,
} from "@/shared/lib/zod/schemas/discover-skill";

// > 从 GET /api/discover/skills 获取广场列表；非 2xx 时解析后端统一错误体并抛出
export const getDiscoverSkills = async (
	params?: ListDiscoverSkillsDto,
): Promise<DiscoverSkillListVo> => {
	const searchParams = new URLSearchParams();
	if (params?.q) searchParams.set("q", params.q);
	if (params?.offset !== undefined) searchParams.set("offset", String(params.offset));

	const url = `/api/discover/skills${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as DiscoverSkillListVo;
};
