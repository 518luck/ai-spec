"use client";

// # AGENTS.md 文档卡片网格：每张卡对应一份文档，标出它所在的文件夹层级，点击进入阅读

import type { JSX } from "react";

import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Icons } from "@/shared/ui/icons";

interface AgentsMdCardGridProps {
	agentsMds: AgentsMdListItemVo[];
	/** 点击卡片时上抛文档 id，右侧切换为阅读视图 */
	onOpen: (agentsMdId: string) => void;
}

export function AgentsMdCardGrid({ agentsMds, onOpen }: AgentsMdCardGridProps): JSX.Element {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{agentsMds.map((agentsMd) => (
				<AgentsMdCard key={agentsMd.id} agentsMd={agentsMd} onOpen={onOpen} />
			))}
		</div>
	);
}

interface AgentsMdCardProps {
	agentsMd: AgentsMdListItemVo;
	onOpen: (agentsMdId: string) => void;
}

// 单张卡片：标题按钮的伪元素铺满卡面实现整卡可点，底部标注文档所在文件夹路径
function AgentsMdCard({ agentsMd, onOpen }: AgentsMdCardProps): JSX.Element {
	// 文件夹路径由 path 去掉末段（文件名）得出，顶层文档显示为项目根
	const folderPath = agentsMd.path.includes("/") ? agentsMd.path.replace(/\/[^/]+$/, "") : "/";

	return (
		<Card size="sm" className="relative transition hover:ring-foreground/25">
			<CardHeader>
				<CardTitle>
					<button
						type="button"
						onClick={() => onOpen(agentsMd.id)}
						className="cursor-pointer outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
					>
						{agentsMd.title}
					</button>
				</CardTitle>
				<CardDescription className="line-clamp-2">{agentsMd.excerpt}</CardDescription>
			</CardHeader>
			<CardFooter className="gap-1.5 text-muted-foreground text-xs">
				<Icons.folderClosed className="size-3.5 shrink-0" />
				<span className="truncate font-mono">{folderPath}</span>
			</CardFooter>
		</Card>
	);
}
