"use client";

// # 用户头像浮层：头像触发，展示用户名/邮箱与退出登录入口

import { signOut, useSession } from "next-auth/react";
import type { JSX } from "react";

import { UserAvatar } from "@/features/user-avatar";
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

// 主动退出标记 cookie：种下后 middleware 不再自动登录该访客
const OPT_OUT_COOKIE = "ai-spec.guest-opt-out";

export function UserAvatarPopover(): JSX.Element {
	const { data: session } = useSession();

	// > 退出登录：先种 opt-out cookie 防止 middleware 再次自动登录，再调 signOut
	const handleSignOut = (): void => {
		// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API 尚属实验特性、浏览器支持不全；种 opt-out 标记用 document.cookie 是兼容性最好的标准做法
		document.cookie = `${OPT_OUT_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
		signOut({ redirectTo: "/spec/login" });
	};

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
					onClick={handleSignOut}
					className="flex w-full items-center gap-2 rounded-md text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					<Icons.logout className="size-4" />
					<span>退出登录</span>
				</button>
			</PopoverContent>
		</Popover>
	);
}
