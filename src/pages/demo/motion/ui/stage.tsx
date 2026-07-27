"use client";

// # 演示舞台外壳：统一每个示例的外框、标题与重播按钮
// > 重播靠给内容套一层带自增 key 的容器：key 一变整棵子树重新挂载，initial → animate 自然重跑一遍

import { type JSX, type ReactNode, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type StageProps = {
	title: string;
	description: string;
	className?: string;
	children: ReactNode;
};

export function Stage({ title, description, className, children }: StageProps): JSX.Element {
	const [runId, setRunId] = useState(0);

	return (
		<section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
			<header className="flex items-start justify-between gap-3 border-border border-b px-4 py-3">
				<div className="min-w-0">
					<h2 className="font-medium text-sm">{title}</h2>
					<p className="mt-0.5 text-muted-foreground text-xs">{description}</p>
				</div>
				<Button variant="ghost" size="xs" onClick={() => setRunId((current) => current + 1)}>
					重播
				</Button>
			</header>

			<div className={cn("grid min-h-56 place-items-center p-6", className)}>
				<div key={runId} className="w-full">
					{children}
				</div>
			</div>
		</section>
	);
}
