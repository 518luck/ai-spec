"use client";

import { AnimatedSizeContainer } from "@/shared/ui/animated-size-container";
import { AuthMethodsSeparator } from "@/shared/ui/auth-methods-separator";
import { SignUpEmail } from "./signup-email";
import { SignUpOAuth } from "./signup-oauth";

// # 注册表单组合：邮箱注册 + 第三方 OAuth 入口
export const SignUpForm = ({
	methods = ["email", "google", "github"],
}: {
	methods?: ("email" | "google" | "github")[];
}) => {
	return (
		<AnimatedSizeContainer height>
			<div className="flex flex-col gap-3 p-1">
				{methods.includes("email") && <SignUpEmail />}
				{methods.length && <AuthMethodsSeparator />}
				<SignUpOAuth methods={methods} />
			</div>
		</AnimatedSizeContainer>
	);
};
