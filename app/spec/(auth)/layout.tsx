"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import AuthLayout from "@/app/layouts/auth-layouts/ui/auth-layout";

// # 认证页布局（强制暗色模式）

// auth 页面强制暗色模式，卸载时恢复系统主题
export default function Layout({ children }: { children: React.ReactNode }) {
	const { setTheme } = useTheme();

	useEffect(() => {
		setTheme("dark");
		return () => {
			setTheme("system");
		};
	}, [setTheme]);

	return <AuthLayout>{children}</AuthLayout>;
}
