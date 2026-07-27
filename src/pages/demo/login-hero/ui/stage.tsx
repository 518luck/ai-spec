"use client";

// # 侧板演示舞台：按登录页右栏的暗色底与纵向比例裁一块画布，统一标题与重播按钮
// > 重播靠给内容套一层带自增 key 的容器：key 一变整棵子树重新挂载，进场动画自然重跑

import { type JSX, type ReactNode, useState } from "react";

import { Button } from "@/shared/ui/button";

type StageProps = {
	title: string;
	description: string;
	children: ReactNode;
};

export function Stage({ title, description, children }: StageProps): JSX.Element {
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

			{/* 画布固定为登录右栏的暗底色，与真实环境一致，不随演示页主题变化 */}
			<div className="relative h-160 overflow-hidden bg-neutral-950">
				<div key={runId} className="absolute inset-0">
					{children}
				</div>
			</div>
		</section>
	);
}
