import type { JSX, ReactNode } from "react";

import { UserAvatar } from "@/entities/user";
import { auth } from "@/shared/lib/auth/auth";
import { Card, CardTitle } from "@/shared/ui/card";
import { HeaderedPageShell } from "@/widgets/page-shell";

// 渲染个人详情页面，以卡片展示名称（含头像）与邮箱
export async function ProfilePage(): Promise<JSX.Element> {
  // 服务端读取会话，避免 useSession 的 loading 闪烁
  const session = await auth();
  const user = session?.user;
  const name = user?.name?.trim() || "";
  const email = user?.email?.trim() || "";

  return (
    <HeaderedPageShell title="个人详情">
      <div className="flex flex-col gap-4">
        <ProfileFieldCard
          title="名称"
          aside={<UserAvatar user={user} className="size-24" />}
        >
          <span className={name ? undefined : "text-muted-foreground"}>
            {name || "未设置"}
          </span>
        </ProfileFieldCard>
        <ProfileFieldCard title="邮箱">
          <span className={email ? undefined : "text-muted-foreground"}>
            {email || "未绑定邮箱"}
          </span>
        </ProfileFieldCard>
      </div>
    </HeaderedPageShell>
  );
}

type ProfileFieldCardProps = {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
};

// 个人详情字段卡片：上半区为标题/内容（可选 aside 头像），底部为贯穿的前景色描述条带
function ProfileFieldCard({
  title,
  children,
  aside,
}: ProfileFieldCardProps): JSX.Element {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center gap-(--card-spacing) px-(--card-spacing) pt-3 pb-(--card-spacing)">
        <div className="flex flex-1 flex-col gap-(--card-spacing)">
          <CardTitle>{title}</CardTitle>
          <div>{children}</div>
        </div>
        {aside ? (
          <div className="flex shrink-0 items-center self-stretch">{aside}</div>
        ) : null}
      </div>
      <div className="border-border bg-muted text-muted-foreground border-t px-(--card-spacing) py-2 text-xs">
        描述
      </div>
    </Card>
  );
}
