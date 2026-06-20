import * as z from "zod/v4";

import { emailSchema } from "./auth";

// 用户名称校验：非空、最多 32 字
export const userNameSchema = z
  .string()
  .trim()
  .min(1, "请输入名称")
  .max(32, "名称最多 32 字");

// 头像校验：必须是 data URL（data:image/...;base64,...）
export const userAvatarSchema = z
  .string()
  .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "头像格式不正确");

// 默认工作区 ID 校验
// TODO: 工作空间功能尚未上线，此 schema 暂为占位
export const defaultWorkspaceIdSchema = z.string().min(1);

// PATCH /api/user 的部分更新入参：四字段全可选，至少提交一个
export const updateUserSchema = z
  .object({
    name: userNameSchema.optional(),
    email: emailSchema.optional(),
    avatar: userAvatarSchema.optional(),
    defaultWorkspace: defaultWorkspaceIdSchema.optional(),
  })
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    "至少提交一个更新字段",
  );
