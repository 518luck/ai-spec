"use client";

import { SETTINGS_PROFILE_PATH } from "@/pages/spec/auth/confirm-email-change/model/config";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type JSX, useEffect } from "react";
import { StatusMessage } from "./status-message";

// 邮箱变更成功后的最小客户端组件：刷新 session（拿到新邮箱）后跳转设置页
export function ConfirmEmailChangeClient(): JSX.Element {
  const router = useRouter();
  const { update } = useSession();

  useEffect(() => {
    const run = async (): Promise<void> => {
      // 触发 jwt 回调 trigger="update"，重读用户表使新邮箱立即生效
      await update();
      router.replace(SETTINGS_PROFILE_PATH);
    };

    void run();
  }, [update, router]);

  return (
    <StatusMessage
      title="邮箱变更成功"
      description="您的账户绑定邮箱已更新，即将跳转到设置页面…"
    />
  );
}
