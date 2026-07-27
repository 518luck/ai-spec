// # 发现广场 Organization 列表 API：供 skills 侧边栏/过滤标签使用

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { OrganizationListVo } from "@/shared/lib/zod/schemas/discover-skill";
import { organizationListVoSchema } from "@/shared/lib/zod/schemas/discover-skill";

// > 从 GET /api/discover/skills/organizations 拉取组织分组列表；非 2xx 时解析后端统一错误体并抛出
export const getDiscoverOrganizations = async (): Promise<OrganizationListVo> => {
	const response = await fetch("/api/discover/skills/organizations");

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return organizationListVoSchema.parse(await response.json());
};
