import * as z from "zod/v4";

import { FOLDERABLE_RESOURCE_KEYS } from "@/server/rbac/resource-ui";

// # 文件夹相关 zod schema：名称、资源类型、颜色、选项、列表校验

// 文件夹名称：必填，1~32 字
export const folderNameSchema = z
	.string({ error: "请输入文件夹名称" })
	.trim()
	.min(1, { error: "请输入文件夹名称" })
	.max(32, { error: "名称长度不能超过 32 个字符" });

// 文件夹归属的资源类型，从 RBAC 可归类资源清单派生（单一真相，加资源只改 resource-ui.ts）
export const folderResourceTypeSchema = z.enum(FOLDERABLE_RESOURCE_KEYS);

// 创建文件夹的请求入参 schema（Dto 入）
export const createFolderDtoSchema = z.object({
	name: folderNameSchema,
	resource_type: folderResourceTypeSchema,
});

// 创建文件夹入参类型
export type CreateFolderDto = z.infer<typeof createFolderDtoSchema>;

// 文件夹颜色：#RRGGBB 格式（不含 alpha 通道，天然不支持透明）；不透明、格式非法时校验失败
export const folderColorSchema = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, { error: "颜色需为 #RRGGBB 格式" })
	.optional()
	.nullable();

// 文件夹选项（与 FolderCombobox 的 FolderOption 形状一致，供前后端共用）
export const folderOptionSchema = z.object({
	value: z.string(),
	label: z.string(),
	color: folderColorSchema,
	resource_type: folderResourceTypeSchema.optional(),
});

// 文件夹选项类型
export type FolderOptionVo = z.infer<typeof folderOptionSchema>;

// 文件夹列表响应 schema（Vo 出）
export const folderListVoSchema = z.array(folderOptionSchema);
