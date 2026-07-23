// # 版本详情 API：获取特定版本的完整内容

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { VersionDetailVo } from "@/shared/lib/zod/schemas/prompt/record";

// > 获取版本详情
export const getVersionDetail = async ({
	recordId,
	versionId,
}: {
	recordId: string;
	versionId: string;
}): Promise<VersionDetailVo> => {
	const response = await fetch(`/api/prompt/records/${recordId}/versions/${versionId}`);

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as VersionDetailVo;
};
