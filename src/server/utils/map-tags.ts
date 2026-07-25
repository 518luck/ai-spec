// # 关联标签映射：剥掉中间表外壳，挑出 VO 所需的扁平字段
// > 收录(PromptRecordTag)、规约(RuleTag)等显式 m-n 关联表共用此映射

export const mapTags = (
	tags: Array<{
		tag: { id: string; name: string; color: string; resourceType: string };
	}>,
) =>
	tags.map((t) => ({
		id: t.tag.id,
		name: t.tag.name,
		color: t.tag.color,
		resourceType: t.tag.resourceType,
	}));
