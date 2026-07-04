import Link from "next/link";
import type { JSX } from "react";
import { appConfig } from "@/shared/configs/app.config";
import { AuthFormLayout } from "@/widgets/auth-form-layout";
import { LoginForm } from "./login-form";

// TODO : 需要构建登陆的页面元信息
// export const metadata = constructMetadata({
//   title: `Sign in to ${appConfig.appName}`,
//   canonicalUrl: `${APP_DOMAIN}/login`,
// });

// 渲染登录页面并挂载登录表单。
export default function LoginPage(): JSX.Element {
  return (
    <AuthFormLayout showTerms="app">
      <div className="w-full max-w-sm">
        <h3 className="text-center font-semibold text-xl">登录您的 {appConfig.appName} 账号</h3>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center font-medium text-neutral-500 text-sm">
          还没有账号？&nbsp;
          <Link
            href="register"
            className="font-semibold text-neutral-400 transition-colors hover:text-neutral-300"
          >
            去注册
          </Link>
        </p>
      </div>
    </AuthFormLayout>
  );
}
