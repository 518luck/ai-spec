import * as z from "zod/v4";

// 文件夹名称：必填，1~64 字
export const folderNameSchema = z
	.string({ error: "请输入文件夹名称" })
	.trim()
	.min(1, { error: "请输入文件夹名称" })
	.max(64, { error: "名称长度不能超过 64 个字符" });

// 创建文件夹的请求入参 schema（Dto 入）
export const createFolderDtoSchema = z.object({
	name: folderNameSchema,
});

// 创建文件夹入参类型
export type CreateFolderDto = z.infer<typeof createFolderDtoSchema>;

// 文件夹选项（与 FolderCombobox 的 FolderOption 形状一致，供前后端共用）
export const folderOptionSchema = z.object({
	value: z.string(),
	label: z.string(),
	icon: z.string().nullable().optional(),
});

// 文件夹选项类型
export type FolderOptionVo = z.infer<typeof folderOptionSchema>;

// 文件夹列表响应 schema（Vo 出）
export const folderListVoSchema = z.array(folderOptionSchema);
