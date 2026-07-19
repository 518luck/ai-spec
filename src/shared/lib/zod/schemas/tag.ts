import { z } from "@/shared/lib/zod";

// # 标签（Tag）相关 zod schema：名称、颜色、选项、列表校验
// ! Tag 是全局共享字典（name 唯一，无 owner/resourceType），与 folder 的"每用户每资源一套"不同

// @ 拼装件
// 标签名称：必填，1~32 字（全局唯一，后端用 upsert 保证同名复用）
export const tagNameSchema = z
	.string({ error: "请输入标签名称" })
	.trim()
	.min(1, { error: "请输入标签名称" })
	.max(32, { error: "名称长度不能超过 32 个字符" });

// 标签颜色：#RRGGBB 格式（不含 alpha 通道），与 folderColorSchema 一致
export const tagColorSchema = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, { error: "颜色需为 #RRGGBB 格式" });

// @ 入参
// 创建标签入参：name 必填，color 可选（后端有默认值）
export const createTagDtoSchema = z.object({
	name: tagNameSchema,
	color: tagColorSchema.optional(),
});

// 创建标签入参类型
export type CreateTagDto = z.infer<typeof createTagDtoSchema>;

// @ 出参
// 标签选项：列表项与编辑回填共用此形状
export const tagOptionVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	color: tagColorSchema,
});

// 标签选项类型
export type TagOptionVo = z.infer<typeof tagOptionVoSchema>;

// 标签列表响应
export const tagListVoSchema = z.array(tagOptionVoSchema);

// 标签列表响应类型
export type TagListVo = z.infer<typeof tagListVoSchema>;
