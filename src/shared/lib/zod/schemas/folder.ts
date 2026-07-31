import { FOLDERABLE_RESOURCE_KEYS } from "@/server/rbac/resource-ui";
import { z } from "@/shared/lib/zod";

// # 文件夹相关 zod schema：名称、资源类型、颜色、选项、列表校验
// > schema 值统一收进 FolderSchemas 聚合对象，type 保留独立导出

// @ 拼装件（局部变量，供 Dto/Vo 组装用）
// 文件夹名称：必填，1~32 字
const name = z
	.string({ error: "请输入文件夹名称" })
	.trim()
	.min(1, { error: "请输入文件夹名称" })
	.max(32, { error: "名称长度不能超过 32 个字符" });

// 文件夹描述：可选，最多 200 字
const description = z
	.string()
	.trim()
	.max(200, { error: "描述长度不能超过 200 个字符" })
	.optional()
	.or(z.literal(""));

// 文件夹归属的资源类型，从 RBAC 可归类资源清单派生（单一真相，加资源只改 resource-ui.ts）
const resourceType = z.enum(FOLDERABLE_RESOURCE_KEYS);

// 文件夹颜色：#RRGGBB 格式（不含 alpha 通道），DB 有 @default，这里必填校验格式
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "颜色需为 #RRGGBB 格式" });

// 文件夹所属的规约领域空间：仅 resourceType="rules" 的文件夹使用，省略时后端回落个人默认空间
const spaceId = z.string().optional();

// @ 出参 Vo
// 文件夹信息：resourceType 为业务命名，route 层负责从 DB 字段 resource_type 映射
const optionVo = z.object({
	id: z.string(),
	name: z.string(),
	color,
	resourceType: resourceType.optional(),
});

// @ 聚合对象：所有 schema 值按「拼装件 / 入参 Dto / 出参 Vo」分组
export const FolderSchemas = {
	// @ 拼装件（也导出，消费侧可能单独用）
	name,
	description,
	resourceType,
	color,
	spaceId,

	// @ 入参 Dto
	// 创建文件夹入参
	createDto: z.object({
		name,
		description,
		color,
		resourceType,
		spaceId,
	}),

	// @ 出参 Vo
	optionVo,

	// 文件夹列表响应
	listVo: z.array(optionVo),
} as const;

// 资源类型字面量联合，供组件 prop 类型收窄用（避免传 string 导致 oRPC input 类型不匹配）
export type FolderResourceType = z.infer<typeof FolderSchemas.resourceType>;

// @ 派生类型（保留独立导出，消费侧 import type）
export type CreateFolderDto = z.infer<typeof FolderSchemas.createDto>;
export type FolderOptionVo = z.infer<typeof FolderSchemas.optionVo>;
export type FolderListVo = z.infer<typeof FolderSchemas.listVo>;
