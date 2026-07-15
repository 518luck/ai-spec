import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "@/features/toast";
import { createUserAccountAction } from "@/server/actions/auth/create-user-account";
import { useMediaQuery } from "@/shared/hooks";
import { Button } from "@/shared/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";
import { Spinner } from "@/shared/ui/spinner";
import { useRegisterContext } from "../model/register-context";
import { ResendOtp } from "./resend-otp";

// # 邮箱验证码表单：6 位 OTP 输入完整后自动校验并创建账户
export function VerifyEmailForm() {
	const router = useRouter();
	const { email, password } = useRegisterContext();
	const { isMobile } = useMediaQuery();
	const [code, setCode] = useState("");
	const [isInvalidCode, setIsInvalidCode] = useState(false);
	const [isRedirecting, setIsRedirecting] = useState(false);
	// 记录创建账户过程中的 toast，用于把 loading 更新为成功或失败状态。
	const toastIdRef = useRef<string | number | undefined>(undefined);

	// 校验code 同时创建账户
	const { executeAsync, isPending } = useAction(createUserAccountAction, {
		onExecute() {
			toastIdRef.current = toast.loading("正在创建账户...");
		},
		onSuccess() {
			toast.success("账户创建成功  (^u^)", {
				id: toastIdRef.current,
			});
			setIsRedirecting(true);
			router.replace("/");
		},
		onError({ error }) {
			toast.error(error.serverError ?? "创建账户失败", {
				id: toastIdRef.current,
			});
			setCode("");
			setIsInvalidCode(true);
		},
	});

	return (
		<div className="flex flex-col items-center">
			<InputOTP
				maxLength={6}
				value={code}
				onChange={(value) => {
					setIsInvalidCode(false);
					setCode(value);
				}}
				autoFocus={!isMobile} //非移动端自动聚焦
				// > 6 位输满即自动提交校验，校验通过创建账户并跳转首页
				onComplete={(completedCode) => {
					executeAsync({ email, password, code: completedCode });
				}}
			>
				<InputOTPGroup className="gap-4 border-0 ring-0 has-aria-invalid:border-0 has-aria-invalid:ring-0">
					<InputOTPSlot
						className="h-14 w-13 rounded-xl border bg-background/60 backdrop-blur-xs"
						index={0}
						aria-invalid={isInvalidCode}
					/>
					<InputOTPSlot
						className="h-14 w-13 rounded-xl border bg-background/60 backdrop-blur-xs"
						index={1}
						aria-invalid={isInvalidCode}
					/>
					<InputOTPSlot
						className="h-14 w-13 rounded-xl border bg-background/60 backdrop-blur-xs"
						index={2}
						aria-invalid={isInvalidCode}
					/>
					<InputOTPSlot
						className="h-14 w-13 rounded-xl border bg-background/60 backdrop-blur-xs"
						index={3}
						aria-invalid={isInvalidCode}
					/>
					<InputOTPSlot
						className="h-14 w-13 rounded-xl border bg-background/60 backdrop-blur-xs"
						index={4}
						aria-invalid={isInvalidCode}
					/>
					<InputOTPSlot
						className="h-14 w-13 rounded-xl border bg-background/60 backdrop-blur-xs"
						index={5}
						aria-invalid={isInvalidCode}
					/>
				</InputOTPGroup>
			</InputOTP>

			{isInvalidCode ? (
				<p id="otp-error" className="mt-3 text-center text-destructive text-sm">
					验证码错误，请重新输入
				</p>
			) : null}

			<Button
				className="mt-8 flex w-full items-center bg-primary/70 backdrop-blur-md hover:bg-primary/80"
				type="submit"
				disabled={!code || code.length < 6}
			>
				{(isPending || isRedirecting) && <Spinner />}
				{isPending ? "验证中..." : "继续"}
			</Button>

			<ResendOtp email={email} />
		</div>
	);
}
