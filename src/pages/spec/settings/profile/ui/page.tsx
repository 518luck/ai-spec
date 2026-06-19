import type { JSX } from "react";

import { AvatarUploader } from "@/features/upload-avatar";
import { auth } from "@/shared/lib/auth/auth";
import { HeaderedPageShell } from "@/widgets/page-shell";

import { EditableFieldCard } from "./editable-field-card";

// 渲染个人详情页面，以可编辑卡片展示名称（含头像）与邮箱
export async function ProfilePage(): Promise<JSX.Element> {
  // 服务端读取会话，避免 useSession 的 loading 闪烁
  const session = await auth();
  const user = session?.user;
  const name = user?.name?.trim() || "";
  const email = user?.email?.trim() || "";

  return (
    <HeaderedPageShell title="个人详情">
      <div className="flex flex-col gap-4">
        <EditableFieldCard
          title="名称"
          defaultValue={name}
          placeholder="未设置"
          description="用于展示你的昵称"
          aside={<AvatarUploader className="size-24" />}
        />
        <EditableFieldCard
          title="邮箱"
          defaultValue={email}
          placeholder="未绑定邮箱"
          description="用于接收通知"
        />
      </div>
    </HeaderedPageShell>
  );
}
