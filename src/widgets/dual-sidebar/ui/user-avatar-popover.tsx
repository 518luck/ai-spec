"use client";

import { useRouter } from "next/navigation";
import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Icons } from "@/shared/ui/icons";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Separator } from "@/shared/ui/separator";

// 渲染用户头像弹窗，展示个人信息占位与退出登录入口
export function UserAvatarPopover(): JSX.Element {
  // const { data: session } = useSession();
  const router = useRouter();

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors",
        )}
        render={
          <button type="button">
            <Avatar>
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <PopoverContent side="right" align="end" sideOffset={8} className="w-56">
        <PopoverHeader>
          <PopoverTitle>用户名</PopoverTitle>
        </PopoverHeader>
        <Separator />
        <button
          type="button"
          onClick={() => router.push("/spec/register")}
          className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-md text-sm transition-colors"
        >
          <Icons.logout className="size-4" />
          <span>退出登录</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
