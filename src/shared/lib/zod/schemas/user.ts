import { z } from "@/shared/lib/zod";

import { emailSchema } from "./auth";

// # 用户相关 zod schema：名称、头像、默认工作区、部分更新校验
// > schema 值统一收进 UserSchemas 聚合对象，type 保留独立导出

// @ 拼装件（局部变量，供 Dto 组装用）
// 用户名称校验：非空、最多 32 字
const name = z.string().trim().min(1, { error: "请输入名称" }).max(32, { error: "名称最多 32 字" });

// 头像校验：必须是 data URL（data:image/...;base64,...）
const avatar = z.string().regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "头像格式不正确");

// 默认工作区 ID 校验
// ? TODO: 工作空间功能尚未上线，此 schema 暂为占位
const defaultWorkspaceId = z.string().min(1);

// @ 聚合对象：所有 schema 值按「拼装件 / 入参 Dto / 出参 Vo」分组
export const UserSchemas = {
	// @ 拼装件（也导出，消费侧可能单独用）
	name,
	avatar,
	defaultWorkspaceId,

	// @ 入参 Dto
	// 用户资料部分更新入参：四字段全可选，至少提交一个
	updateDto: z
		.object({
			name: name.optional(),
			email: emailSchema.optional(),
			avatar: avatar.optional(),
			defaultWorkspace: defaultWorkspaceId.optional(),
		})
		.refine((d) => Object.values(d).some((v) => v !== undefined), "至少提交一个更新字段"),

	// @ 出参 Vo
	// 用户资料响应：id、名称、邮箱、头像 URL（image 可空）
	vo: z.object({
		id: z.string(),
		name: z.string(),
		email: z.string(),
		image: z.string().nullable(),
	}),
} as const;

// @ 派生类型（保留独立导出，消费侧 import type）
export type UpdateUserDto = z.infer<typeof UserSchemas.updateDto>;
export type UserVo = z.infer<typeof UserSchemas.vo>;
