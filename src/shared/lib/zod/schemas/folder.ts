import * as z from "zod/v4";

import { FOLDERABLE_RESOURCE_KEYS } from "@/server/rbac/resource-ui";

// # 文件夹相关 zod schema：名称、资源类型、颜色、选项、列表校验

// @ 拼装件
// 文件夹名称：必填，1~32 字
export const folderNameSchema = z
	.string({ error: "请输入文件夹名称" })
	.trim()
	.min(1, { error: "请输入文件夹名称" })
	.max(32, { error: "名称长度不能超过 32 个字符" });

// 文件夹描述：可选，最多 200 字
export const folderDescriptionSchema = z
	.string()
	.trim()
	.max(200, { error: "描述长度不能超过 200 个字符" })
	.optional()
	.or(z.literal(""));

// 文件夹归属的资源类型，从 RBAC 可归类资源清单派生（单一真相，加资源只改 resource-ui.ts）
export const folderResourceTypeSchema = z.enum(FOLDERABLE_RESOURCE_KEYS);

// 文件夹颜色：#RRGGBB 格式（不含 alpha 通道，天然不支持透明）；不透明、格式非法时校验失败
export const folderColorSchema = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, { error: "颜色需为 #RRGGBB 格式" })
	.optional()
	.nullable();

// @ 入参
// 创建文件夹入参
export const createFolderDtoSchema = z.object({
	name: folderNameSchema,
	description: folderDescriptionSchema,
	color: folderColorSchema,
	resource_type: folderResourceTypeSchema,
});

// 创建文件夹入参类型
export type CreateFolderDto = z.infer<typeof createFolderDtoSchema>;

// @ 出参
// 文件夹信息（返回数据库原始字段名，前端 UI 层自行映射 value/label）
export const folderOptionVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	color: folderColorSchema,
	resource_type: folderResourceTypeSchema.optional(),
});

// 文件夹信息类型
export type FolderOptionVo = z.infer<typeof folderOptionVoSchema>;

// 文件夹列表响应
export const folderListVoSchema = z.array(folderOptionVoSchema);
