import { AuthFormLayout } from "@/widgets/auth-form-layout";
import Link from "next/link";

// export const metadata = constructMetadata({
//   title: `Sign in to ${process.env.NEXT_PUBLIC_APP_NAME}`,
//   canonicalUrl: `${APP_DOMAIN}/login`,
// });

export default function LoginPage() {
  return (
    <AuthFormLayout showTerms="app">
      <div className="w-full max-w-sm">
        <h3 className="text-center text-xl font-semibold">登录您的 Dub 账号</h3>
        <div className="mt-8">{/* <LoginForm /> */}</div>
        <p className="mt-6 text-center text-sm font-medium text-neutral-500">
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
