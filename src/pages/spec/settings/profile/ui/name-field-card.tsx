"use client";

import type { JSX, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { EditableFieldCard } from "./editable-field-card";

type NameFieldCardProps = {
  defaultValue?: string;
  aside?: ReactNode;
};

// 名称字段卡片：复用通用 EditableFieldCard，注入调用 /api/user 的保存逻辑
export function NameFieldCard({
  defaultValue,
  aside,
}: NameFieldCardProps): JSX.Element {
  const { update } = useSession();
  const router = useRouter();

  // 提交新名称：写库失败抛错由卡片兜底 toast；成功后重铸 JWT 并刷新服务端组件，使新名称同步到顶栏等位置
  const handleSave = async (name: string): Promise<void> => {
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      let message = "名称保存失败";
      try {
        const body = (await res.json()) as { error?: { message?: unknown } };
        if (typeof body.error?.message === "string") {
          message = body.error.message;
        }
      } catch {
        // 响应体非 JSON（如网关错误页），使用兜底文案
      }
      throw new Error(message);
    }

    await update({});
    router.refresh();
  };

  return (
    <EditableFieldCard
      title="名称"
      defaultValue={defaultValue}
      placeholder="未设置"
      description="用于展示你的昵称"
      aside={aside}
      onSave={handleSave}
    />
  );
}
