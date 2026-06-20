"use client";

import type { JSX } from "react";

import { updateUser } from "@/entities/user";
import { emailSchema } from "@/shared/lib/zod/schemas/auth";

import { EditableFieldCard } from "./editable-field-card";

type EmailFieldCardProps = {
  defaultValue?: string;
};

// 邮箱字段卡片：提交后给新邮箱发确认邮件（不立即改库），成功回退输入并提示去查收
export function EmailFieldCard({
  defaultValue,
}: EmailFieldCardProps): JSX.Element {
  // 提交新邮箱：先本地校验格式与“是否变化”，再请求后端查重并发确认邮件；失败抛错由卡片兜底 toast
  const handleSave = async (email: string): Promise<void> => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "邮箱格式不正确");
    }
    if (parsed.data === defaultValue) {
      throw new Error("新邮箱与当前邮箱相同");
    }
    // 成功只代表确认邮件已入队；DB 邮箱未变，故不刷新 session/router
    await updateUser({ email: parsed.data });
  };

  return (
    <EditableFieldCard
      title="邮箱"
      defaultValue={defaultValue}
      placeholder="未绑定邮箱"
      description="用于接收通知"
      onSave={handleSave}
      successMessage="确认邮件已发送，请到新邮箱查收完成验证"
      revertOnSuccess
    />
  );
}
