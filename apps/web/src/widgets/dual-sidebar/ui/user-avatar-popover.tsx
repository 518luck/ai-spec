"use client";

import { signOut, useSession } from "next-auth/react";
import type { JSX } from "react";

import { UserAvatar } from "@/entities/user";
import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Separator } from "@/shared/ui/separator";

// 渲染用户头像弹窗，展示个人信息占位与退出登录入口
export function UserAvatarPopover(): JSX.Element {
  const { data: session } = useSession();

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors",
        )}
        render={
          <button type="button">
            <UserAvatar user={session?.user} />
          </button>
        }
      />
      <PopoverContent side="right" align="end" sideOffset={8} className="w-56">
        <PopoverHeader>
          <PopoverTitle>{session?.user?.name ?? "游客"}</PopoverTitle>
          {session?.user?.email ? (
            <PopoverDescription className="min-w-0 truncate">
              {session?.user?.email}
            </PopoverDescription>
          ) : null}
        </PopoverHeader>
        <Separator />
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/spec/login" })}
          className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-md text-sm transition-colors"
        >
          <Icons.logout className="size-4" />
          <span>退出登录</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
