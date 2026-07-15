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

// 文件夹颜色：#RRGGBB 格式（不含 alpha 通道），DB 有 @default，这里必填校验格式
export const folderColorSchema = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, { error: "颜色需为 #RRGGBB 格式" });

// @ 入参
// 创建文件夹入参
export const createFolderDtoSchema = z.object({
	name: folderNameSchema,
	description: folderDescriptionSchema,
	color: folderColorSchema,
	resourceType: folderResourceTypeSchema,
});

// 创建文件夹入参类型
export type CreateFolderDto = z.infer<typeof createFolderDtoSchema>;

// @ 出参
// 文件夹信息：resourceType 为业务命名，route 层负责从 DB 字段 resource_type 映射
export const folderOptionVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	color: folderColorSchema,
	resourceType: folderResourceTypeSchema.optional(),
});

// 文件夹信息类型
export type FolderOptionVo = z.infer<typeof folderOptionVoSchema>;

// 文件夹列表响应
export const folderListVoSchema = z.array(folderOptionVoSchema);

// 文件夹列表响应类型
export type FolderListVo = z.infer<typeof folderListVoSchema>;
