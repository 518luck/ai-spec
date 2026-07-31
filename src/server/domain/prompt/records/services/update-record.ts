// # 收录更新：部分更新，tags 全量替换，name/content 变更时建版本（事务保证原子性）
// > 实际更新+版本逻辑在 updateRecordAndVersion 里（原 maybeUpdateRecordAndVersion）

import type { CreateRecordVo } from "@/shared/lib/zod/schemas/prompt/record";
import { type RecordUpdatePatch, updateRecordAndVersion } from "./update-record-and-version";

export const updateRecord = async ({
	userId,
	id,
	patch,
}: {
	userId: string;
	id: string;
	patch: RecordUpdatePatch;
}): Promise<CreateRecordVo> => {
	return updateRecordAndVersion({ userId, id, patch });
};
