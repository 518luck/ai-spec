"use client";

import { truncate } from "@/shared/lib/utils";
import Link from "next/link";
import {
  RegisterProvider,
  useRegisterContext,
} from "../model/register-context";
import { SignUpForm } from "./signup-form";
import { VerifyEmailForm } from "./verify-email-form";

export default function RegisterPageClient() {
  return (
    <RegisterProvider>
      <RegisterFlow />
    </RegisterProvider>
  );
}

function SignUp() {
  return (
    <>
      <div className="w-full max-w-sm">
        <h3 className="text-center text-xl font-semibold">创建您的账号</h3>
        <div className="mt-8">
          {/* 因为作者在ee其他平台也用了这个signupform,所以把这个方法单独拿出来了 */}
          <SignUpForm />
        </div>
        <p className="mt-6 text-center text-sm font-medium text-neutral-500">
          已有账号？&nbsp;
          <Link
            href="/login"
            className="font-semibold text-neutral-700 transition-colors hover:text-neutral-900"
          >
            去登录
          </Link>
        </p>
      </div>
    </>
  );
}

function Verify() {
  const { email } = useRegisterContext();

  return (
    <>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-center text-xl font-semibold">
            请验证您的电子邮箱地址。
          </h3>
          <p className="text-base font-medium text-neutral-500">
            请输入发送至
            <strong className="font-semibold text-neutral-600">
              {truncate(email, 30)}
            </strong>
            的六位验证码。
          </p>
        </div>
        <div className="mt-12">
          <VerifyEmailForm />
        </div>
      </div>
    </>
  );
}

const RegisterFlow = () => {
  const { step } = useRegisterContext();

  if (step === "signup") return <SignUp />;
  if (step === "verify") return <Verify />;
};
