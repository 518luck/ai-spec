// # 版本回滚 API：回滚到指定版本

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type { RollbackVersionVo } from "@/shared/lib/zod/schemas/prompt/record";

// > 回滚到指定版本
export const rollbackVersion = async ({
	recordId,
	versionId,
}: {
	recordId: string;
	versionId: string;
}): Promise<RollbackVersionVo> => {
	const response = await fetch(`/api/prompt/records/${recordId}/versions/${versionId}/rollback`, {
		method: "POST",
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as RollbackVersionVo;
};
