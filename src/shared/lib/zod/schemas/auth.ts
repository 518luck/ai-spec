import * as z from "zod/v4";

// # 认证相关 zod schema：邮箱、密码、注册、登录校验规则

export const emailSchema = z
	.string()
	.trim()
	.min(1, { error: "请输入邮箱" })
	.pipe(z.email({ error: "请输入有效邮箱" })) //把前一个 schema 的校验结果，继续交给后一个 schema 再校验一次
	.transform((email) => email.toLowerCase());

export const passwordSchema = z
	.string()
	.min(8, "密码至少为8个字符")
	.max(1000, "密码长度不能超过1000个字符")
	.regex(
		// regular expression 的缩写
		/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
		"密码必须包含至少一个数字、一个大写字母和一个小写字母",
	);

export const signUpSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
});

// 登录时的凭据校验 schema
export const signInSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "请输入密码"),
});
