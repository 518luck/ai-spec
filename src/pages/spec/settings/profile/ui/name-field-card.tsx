"use client";

import type { JSX, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { updateUser } from "@/entities/user";
import { userNameSchema } from "@/shared/lib/zod/schemas/user";

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

  // 提交新名称：先本地校验长度避免无谓请求，再写库；失败抛错由卡片兜底 toast；成功后重铸 JWT 并刷新，使新名称同步到顶栏等位置
  const handleSave = async (name: string): Promise<void> => {
    const parsed = userNameSchema.safeParse(name);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "名称格式不正确");
    }

    await updateUser({ name });

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
