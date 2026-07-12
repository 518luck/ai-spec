"use client";

// # 用户头像组件：自定义头像优先，其次 Gravatar，均无则显示占位图标

import type { JSX } from "react";
import { useMemo } from "react";

import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Icons } from "@/shared/ui/icons";

import type { AvatarUser } from "../lib/gravatar";
import { getUserAvatarUrl } from "../lib/gravatar";

type UserAvatarProps = {
	user?: AvatarUser | null;
	size?: "default" | "sm" | "lg";
	className?: string;
};

// 渲染用户头像：优先自定义头像，其次 Gravatar，均无则显示占位图标
export function UserAvatar({ user, size, className }: UserAvatarProps): JSX.Element {
	// 用户身份变化时重新计算头像地址
	const src = useMemo(() => getUserAvatarUrl(user), [user]);

	return (
		<Avatar size={size} className={cn(className)}>
			{/* 始终渲染，src 为空时 base-ui 自动置为 error 由 Fallback 兜底，避免条件挂载导致的状态问题 */}
			<AvatarImage src={src} alt="用户头像" />
			<AvatarFallback>
				<Icons.avatarPlaceholder className="size-full p-1.5 text-muted-foreground" />
			</AvatarFallback>
		</Avatar>
	);
}
