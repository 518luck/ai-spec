// # 编辑者映射：Prisma User.name 可为 null，Vo 要求 string，回退空串
// > 版本列表 / 版本详情共用（rules 和 records 的版本 service 都用）

export const mapEditor = (editor: { id: string; name: string | null; image: string | null }) => ({
	id: editor.id,
	name: editor.name ?? "",
	image: editor.image,
});
