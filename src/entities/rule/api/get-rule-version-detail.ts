// # 规约版本详情 API：获取特定版本的完整内容

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { VersionDetailVo } from "@/shared/lib/zod/schemas/prompt/record";

// > 获取规约版本详情（服务端从快照 + diff 重建完整内容后返回）
export const getRuleVersionDetail = async ({
	ruleId,
	versionId,
}: {
	ruleId: string;
	versionId: string;
}): Promise<VersionDetailVo> => {
	const response = await fetch(`/api/rules/${ruleId}/versions/${versionId}`);

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as VersionDetailVo;
};
