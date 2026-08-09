"use client";

// # 游客访问按钮：清除 opt-out 标记后跳转自动登录，供面试展示一键进入

import type { JSX } from "react";
import { Icons } from "@/shared/ui/icons";

// 与 middleware / user-avatar-popover 保持一致的 cookie 名
const OPT_OUT_COOKIE = "ai-spec.guest-opt-out";

export function GuestLoginButton(): JSX.Element {
	// > 先清除 opt-out cookie，再跳自动登录端点；否则 middleware 会因 opt-out 拦截
	const handleClick = (): void => {
		// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API 尚属实验特性；清除 opt-out 标记用 document.cookie 兼容性最好
		document.cookie = `${OPT_OUT_COOKIE}=; path=/; max-age=0`;
		window.location.href = "/api/auth/auto-login?callbackUrl=/spec/personal";
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 font-medium text-neutral-600 text-sm transition-colors hover:bg-neutral-100 hover:text-neutral-900"
		>
			<Icons.profile className="size-4" />
			<span>以游客身份继续浏览</span>
		</button>
	);
}
