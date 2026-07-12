"use client";

import Link from "next/link";
import { truncate } from "@/shared/lib/utils";
import { RegisterProvider, useRegisterContext } from "../model/register-context";
import { SignUpForm } from "./signup-form";
import { VerifyEmailForm } from "./verify-email-form";

// # 注册页客户端入口：挂载 Provider，按步骤渲染注册/验证流程
export default function RegisterPageClient() {
	return (
		<RegisterProvider>
			<RegisterFlow />
		</RegisterProvider>
	);
}

function SignUp() {
	return (
		<div className="w-full max-w-sm">
			<h3 className="text-center font-semibold text-xl">创建您的账号</h3>
			<div className="mt-8">
				{/* 因为作者在ee其他平台也用了这个signupform,所以把这个方法单独拿出来了 */}
				<SignUpForm />
			</div>
			<p className="mt-6 text-center font-medium text-neutral-500 text-sm">
				已有账号？&nbsp;
				<Link
					href="login"
					className="font-semibold text-neutral-400 transition-colors hover:text-neutral-300"
				>
					去登录
				</Link>
			</p>
		</div>
	);
}

function Verify() {
	const { email } = useRegisterContext();

	return (
		<div className="w-full max-w-sm">
			<div className="flex flex-col items-center gap-1 text-center">
				<h3 className="text-center font-semibold text-xl">请验证您的电子邮箱地址。</h3>
				<p className="font-medium text-base text-neutral-500">
					请输入发送至
					<strong className="font-semibold text-neutral-600">{truncate(email, 30)}</strong>
					的六位验证码。
				</p>
			</div>
			<div className="mt-12">
				<VerifyEmailForm />
			</div>
		</div>
	);
}

// > 步骤切换：signup 填写邮箱密码，verify 输入 OTP 验证码
const RegisterFlow = () => {
	const { step } = useRegisterContext();

	if (step === "signup") return <SignUp />;
	if (step === "verify") return <Verify />;
};
