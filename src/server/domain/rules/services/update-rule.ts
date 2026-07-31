// # 更新规约：部分更新委托给 updateRuleAndVersion（含版本记录，事务保证原子性）

import type { RuleVo } from "@/shared/lib/zod/schemas/rule";
import { type RuleUpdatePatch, updateRuleAndVersion } from "./update-rule-and-version";

// > name/content 变更时建版本，folder/tags/space 变更不建（实际逻辑在 updateRuleAndVersion）
export const updateRule = async ({
	userId,
	id,
	patch,
}: {
	userId: string;
	id: string;
	patch: RuleUpdatePatch;
}): Promise<RuleVo> => {
	return updateRuleAndVersion({ userId, id, patch });
};
