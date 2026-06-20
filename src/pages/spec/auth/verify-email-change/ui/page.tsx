import { appConfig } from "@/shared/configs/app.config";
import { AuthFormLayout } from "@/widgets/auth-form-layout";
import type { JSX } from "react";

// 邮箱变更确认落地页的 props：从 URL query 读取 token
type VerifyEmailChangePageProps = {
  searchParams: Promise<{ token?: string }>;
};

// 渲染邮箱变更确认落地页：校验 token 存在性并展示占位确认 UI（验证写库逻辑待接入）
export async function VerifyEmailChangePage({
  searchParams,
}: VerifyEmailChangePageProps): Promise<JSX.Element> {
  const { token } = await searchParams;

  return (
    <AuthFormLayout showTerms="app">
      <div className="w-full max-w-sm">
        <h3 className="text-center text-xl font-semibold">
          确认更换 {appConfig.appName} 绑定邮箱
        </h3>
        <div className="mt-8">
          {token ? (
            <p className="text-center text-sm font-medium text-neutral-500">
              正在处理您的邮箱变更请求…
            </p>
          ) : (
            <p className="text-destructive text-center text-sm font-medium">
              链接无效或缺少验证参数，请重新发起邮箱变更。
            </p>
          )}
        </div>
      </div>
    </AuthFormLayout>
  );
}
