import { z } from "@/shared/lib/zod";

// # 规约领域空间（RuleSpace）相关 zod schema：空间名称、图标、创建入参与列表出参
// > 领域空间是规约库的顶层隔离：空间 → 文件夹 → 规则，规则的「家」固定在空间里

// @ 拼装件
// 空间名称：必填，1~32 字（同用户下不允许重名，后端落库前查重）
const ruleSpaceNameSchema = z
	.string({ error: "请输入空间名称" })
	.trim()
	.min(1, { error: "请输入空间名称" })
	.max(32, { error: "名称长度不能超过 32 个字符" });

// 空间图标：前端 Icons 注册表的 key（如 rulesLibrary、code），后端只校验长度不认具体取值
const ruleSpaceIconSchema = z
	.string()
	.trim()
	.min(1, { error: "请选择空间图标" })
	.max(32, { error: "图标标识长度不能超过 32 个字符" });

// @ 入参
// 创建领域空间入参：icon 可省略，省略时后端填默认图标；ownerId/teamId 由后端从 session 注入
export const createRuleSpaceDtoSchema = z.object({
	name: ruleSpaceNameSchema,
	icon: ruleSpaceIconSchema.optional(),
});

// 创建领域空间入参类型
export type CreateRuleSpaceDto = z.infer<typeof createRuleSpaceDtoSchema>;

// @ 出参
// 领域空间信息：列表项与新建响应共用此形状
export const ruleSpaceVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	icon: z.string(),
	sortOrder: z.number().int(),
});

// 领域空间信息类型
export type RuleSpaceVo = z.infer<typeof ruleSpaceVoSchema>;

// 领域空间列表响应
export const ruleSpaceListVoSchema = z.array(ruleSpaceVoSchema);

// 领域空间列表响应类型
export type RuleSpaceListVo = z.infer<typeof ruleSpaceListVoSchema>;
