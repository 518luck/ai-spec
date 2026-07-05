"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAction } from "next-safe-action/hooks";
import { type JSX, type SubmitEvent, useState } from "react";
import { toast } from "sonner";
import { checkLoginEmailAction } from "@/server/actions/auth/check-login-email";
import {
	AUTH_FIELD_PASSWORD,
	AUTH_PROVIDER_EMAIL,
	AUTH_REDIRECT_HOME,
} from "@/shared/lib/auth/constants";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { useLoginContext } from "../model/login-context";

// 渲染邮箱登录表单并按需展开密码输入框。
export function LoginEmail(): JSX.Element {
	const router = useRouter();
	// 标记 NextAuth 密码登录请求是否进行中，用于禁用重复提交和展示 loading。
	const [isSigningIn, setIsSigningIn] = useState(false);
	const {
		email,
		password,
		preferredMethod,
		showPasswordField,
		setEmail,
		setPassword,
		setShowPasswordField,
		setPreferredMethod,
	} = useLoginContext();
	const { executeAsync, isPending } = useAction(checkLoginEmailAction);

	const isSubmitting = isPending || isSigningIn;

	// 邮箱变更后收起密码框，确保下一次提交会重新检查账户状态。
	const handleEmailChange = (value: string): void => {
		setEmail(value);

		if (!showPasswordField) {
			return;
		}

		setPassword("");
		setShowPasswordField(false);
	};

	// 登录前先检查账户状态，只有存在密码的账户才调用 NextAuth。
	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();

		if (!showPasswordField) {
			const result = await executeAsync({ email });
			const errorMessage = result.serverError || result.validationErrors?.email?.[0];

			if (errorMessage) {
				toast.error(errorMessage);
				return;
			}

			if (!result.data?.isRegistered) {
				toast.error("账户不存在，请先注册");
				return;
			}
			// TODO:后面需要支持邮箱直接登陆的,可以给signIn传递provider判断
			if (!result.data.hasPassword) {
				toast.error("该邮箱未设置密码，请使用其他登录方式");
				return;
			}

			setShowPasswordField(true);
			return;
		}

		if (!password) {
			toast.error("请输入密码");
			return;
		}

		setIsSigningIn(true);
		const signInResult = await signIn("credentials", {
			email,
			password,
			redirect: false,
			callbackUrl: AUTH_REDIRECT_HOME,
		});

		if (!signInResult?.ok) {
			setIsSigningIn(false);
			toast.error("登录失败，请检查邮箱或密码");
			return;
		}

		setPreferredMethod(AUTH_PROVIDER_EMAIL);
		router.replace(signInResult.url ?? AUTH_REDIRECT_HOME);
	};

	return (
		<form onSubmit={handleSubmit}>
			<FieldSet>
				<FieldGroup className="gap-4">
					<Field>
						<FieldLabel htmlFor="login-email">邮箱</FieldLabel>
						<Input
							id="login-email"
							name={AUTH_PROVIDER_EMAIL}
							type="email"
							placeholder="your-email@example.com"
							autoComplete="email"
							required
							value={email}
							onChange={({ target }) => handleEmailChange(target.value)}
						/>
					</Field>

					{showPasswordField && (
						<Field>
							<FieldLabel htmlFor="login-password">密码</FieldLabel>
							<Input
								id="login-password"
								name={AUTH_FIELD_PASSWORD}
								type={AUTH_FIELD_PASSWORD}
								placeholder="password"
								autoComplete="current-password"
								required
								autoFocus
								value={password}
								disabled={isSigningIn}
								onChange={({ target }) => setPassword(target.value)}
							/>
						</Field>
					)}
				</FieldGroup>
			</FieldSet>

			<Button
				className="mt-4 w-full"
				type="submit"
				disabled={isSubmitting}
				aria-busy={isSubmitting}
			>
				{isSubmitting && <Spinner />}
				{isSigningIn ? "登录中..." : "登录"}
			</Button>
			{preferredMethod === AUTH_PROVIDER_EMAIL && (
				<p className="mt-2 text-center font-medium text-muted-foreground text-xs">
					你上次使用邮箱登录的
				</p>
			)}
		</form>
	);
}
