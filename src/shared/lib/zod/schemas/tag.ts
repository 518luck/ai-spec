import { TAGGABLE_RESOURCE_KEYS } from "@/server/rbac/resource-ui";
import { z } from "@/shared/lib/zod";

// # 标签（Tag）相关 zod schema：名称、颜色、资源类型、选项、列表校验
// > Tag 按"用户 + 团队 + 资源类型"三维隔离，与 Folder 对称（teamId 当前写死 null，团队功能未实现）

// @ 拼装件
// 标签名称：必填，1~32 字（同用户同团队同资源下唯一，后端按复合键 upsert 保证同名复用）
export const tagNameSchema = z
	.string({ error: "请输入标签名称" })
	.trim()
	.min(1, { error: "请输入标签名称" })
	.max(32, { error: "名称长度不能超过 32 个字符" });

// 标签颜色：#RRGGBB 格式（不含 alpha 通道），与 folderColorSchema 一致
export const tagColorSchema = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, { error: "颜色需为 #RRGGBB 格式" });

// 标签归属的资源类型，从 RBAC 可打标签资源清单派生（单一真相，加资源只改 resource-ui.ts）
export const tagResourceTypeSchema = z.enum(TAGGABLE_RESOURCE_KEYS);

// @ 入参
// 创建标签入参：name + color + resourceType 必填；ownerId/teamId 由后端从 session 注入，不暴露进 Dto
export const createTagDtoSchema = z.object({
	name: tagNameSchema,
	color: tagColorSchema,
	resourceType: tagResourceTypeSchema,
});

// 创建标签入参类型
export type CreateTagDto = z.infer<typeof createTagDtoSchema>;

// @ 出参
// 标签选项：列表项与编辑回填共用此形状；resourceType 后端始终返回，前端按需展示
export const tagOptionVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	color: tagColorSchema,
	resourceType: tagResourceTypeSchema,
});

// 标签选项类型
export type TagOptionVo = z.infer<typeof tagOptionVoSchema>;

// 标签列表响应
export const tagListVoSchema = z.array(tagOptionVoSchema);

// 标签列表响应类型
export type TagListVo = z.infer<typeof tagListVoSchema>;
