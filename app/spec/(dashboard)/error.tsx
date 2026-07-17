"use client";

// # Dashboard 错误兜底：主内容区渲染抛错时替换为可重试的错误页，侧边栏保持不变

import { Home, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/shared/ui/button";

// Next.js 注入的 error.tsx props：error 是捕获的异常，reset 清除错误状态重新渲染
type DashboardErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

// dashboard 段错误页：填满 DualSidebarContent 主内容区，保留左侧栏可切换其他页面
export default function DashboardError({ error, reset }: DashboardErrorProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
			<div className="flex flex-col items-center gap-3">
				<TriangleAlert className="size-10 text-muted-foreground" />
				<div>
					<p className="font-medium text-foreground text-sm">页面加载出了点问题</p>
					<p className="mt-1 text-muted-foreground text-xs">信号不太稳定，重新试试看吧</p>
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2">
				<Button size="sm" className="h-8 gap-2 text-xs" onClick={reset}>
					重试
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="h-8 gap-2 text-xs"
					nativeButton={false}
					render={<Link href="/spec/personal/prompt/records" />}
				>
					<Home className="size-3.5" />
					返回首页
				</Button>
			</div>
		</div>
	);
}
