// # 收录关联标签映射：剥掉中间表外壳，规整为扁平 {id,name,color} 数组

// Prisma 嵌套形态 { tag: {...} } → 扁平 {...tag}
export const mapTags = (
	tags: Array<{ tag: { id: string; name: string; color: string; resourceType: string } }>,
) => tags.map((t) => ({ ...t.tag }));
