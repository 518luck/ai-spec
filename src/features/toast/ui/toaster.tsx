"use client";

// # 增强版 Toaster —— 在 sonner 基础上加磨砂质感、类型配色
// > 全局挂载在 root-layout，通过 toast()/toast.success() 等调用自动应用样式

import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { TOAST_STYLE } from "../model/toast-style";
import "../styles/toast.css";

// > 类型图标：每种类型配对应颜色
const TOAST_ICONS = {
	// 成功（绿）
	success: <CircleCheckIcon className="size-4 text-emerald-500" />,
	// 错误（红）
	error: <OctagonXIcon className="size-4 text-red-500" />,
	// 警告（黄）
	warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
	// 信息（蓝）
	info: <InfoIcon className="size-4 text-sky-500" />,
	// 加载（旋转）
	loading: <Loader2Icon className="size-4 animate-spin" />,
} as const;

export function Toaster({ ...props }: ToasterProps) {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			richColors
			className="toaster group"
			icons={TOAST_ICONS}
			style={TOAST_STYLE}
			toastOptions={{
				classNames: {
					toast: "cn-toast backdrop-blur-[1px]",
					actionButton:
						"bg-transparent! text-muted-foreground! hover:text-foreground! hover:bg-transparent! p-1",
				},
			}}
			{...props}
		/>
	);
}
