"use client";

// # 全局错误兜底：整棵树渲染抛错时替换为可重试的错误页，避免白屏

import { Home, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/shared/ui/button";

// Next.js 注入的 error.tsx props：error 是捕获的异常，reset 清除错误状态重新渲染
type GlobalErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

// 全屏错误兜底页：重置渲染状态后用户可点「重试」原地恢复
export default function GlobalError({ error, reset }: GlobalErrorProps) {
	// 记录错误到控制台（生产环境可在此接入 Axiom 等日志服务）
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background p-6 text-center">
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
		</main>
	);
}
