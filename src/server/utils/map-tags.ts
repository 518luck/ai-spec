// # 关联标签映射：剥掉中间表外壳，挑出 VO 所需的扁平字段
// > 收录(PromptRecordTag)、规约(RuleTag)等显式 m-n 关联表共用此映射

import { TagSchemas } from "@/shared/lib/zod/schemas/tag";

// 把关联表结构（{ tag: {...} }）压平成扁平标签视图
// resourceType 在 Prisma schema 里是 String（非 enum），用 TagSchemas.optionVo 校验收窄回字面量联合
export const mapTags = (
	tags: Array<{
		tag: { id: string; name: string; color: string; resourceType: string };
	}>,
) =>
	tags.map((t) =>
		TagSchemas.optionVo.parse({
			id: t.tag.id,
			name: t.tag.name,
			color: t.tag.color,
			resourceType: t.tag.resourceType,
		}),
	);
