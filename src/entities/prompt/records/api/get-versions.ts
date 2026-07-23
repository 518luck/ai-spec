// # 版本历史 API：获取版本列表

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { VersionListVo } from "@/shared/lib/zod/schemas/prompt/record";

// > 获取版本历史列表
export const getVersions = async ({
	recordId,
	offset = 0,
	limit = 20,
}: {
	recordId: string;
	offset?: number;
	limit?: number;
}): Promise<VersionListVo> => {
	const params = new URLSearchParams({
		offset: String(offset),
		limit: String(limit),
	});

	const response = await fetch(`/api/prompt/records/${recordId}/versions?${params}`);

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as VersionListVo;
};
