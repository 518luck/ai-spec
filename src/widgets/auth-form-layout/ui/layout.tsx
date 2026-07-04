import type { PropsWithChildren } from "react";
import { appConfig } from "@/shared/configs/app.config";

export default function AuthFormLayout({
  children,
  showTerms = "app",
}: PropsWithChildren<{ showTerms?: "app" | "partner" }>) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-between">
      <div className="grow basis-0">
        <div className="h-24" />
      </div>

      <div className="flex w-full flex-1 items-center justify-center">{children}</div>

      <div className="flex grow basis-0 flex-col justify-end">
        {showTerms && (
          <p className="px-20 py-8 text-center font-medium text-neutral-500 text-xs leading-5 md:px-0">
            继续操作即表示您同意 {appConfig.appName} 的
            <a
              href={`https://dub.co/legal/${showTerms === "app" ? "terms" : "partners"}`}
              target="_blank"
              className="font-semibold text-neutral-600 hover:text-neutral-800"
              rel="noopener"
            >
              {showTerms === "app" ? "服务条款" : "合作伙伴条款"}
            </a>
            和
            <a
              href="https://dub.co/legal/privacy"
              target="_blank"
              className="font-semibold text-neutral-600 hover:text-neutral-800"
              rel="noopener"
            >
              隐私政策
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
