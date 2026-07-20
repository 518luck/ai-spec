// # 收录关联标签映射：剥掉中间表外壳，挑出 VO 所需的扁平字段

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
