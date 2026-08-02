"use client";

// # AGENTS.md 配置卡片网格：每张卡对应一份配置，标出它所在的文件夹层级，点击进入阅读

import type { JSX } from "react";

import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Icons } from "@/shared/ui/icons";

interface AgentsMdCardGridProps {
	agentsMds: AgentsMdListItemVo[];
	/** 文件夹 id → 名称映射（卡片底部标注挂载位置用） */
	folderNames: Record<string, string>;
	/** 点击卡片时上抛配置 id，右侧切换为阅读视图 */
	onOpen: (agentsMdId: string) => void;
}

export function AgentsMdCardGrid({
	agentsMds,
	folderNames,
	onOpen,
}: AgentsMdCardGridProps): JSX.Element {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{agentsMds.map((agentsMd) => (
				<AgentsMdCard
					key={agentsMd.id}
					agentsMd={agentsMd}
					folderNames={folderNames}
					onOpen={onOpen}
				/>
			))}
		</div>
	);
}

interface AgentsMdCardProps {
	agentsMd: AgentsMdListItemVo;
	folderNames: Record<string, string>;
	onOpen: (agentsMdId: string) => void;
}

// 单张卡片：标题按钮的伪元素铺满卡面实现整卡可点，底部标注配置挂载的文件夹名
function AgentsMdCard({ agentsMd, folderNames, onOpen }: AgentsMdCardProps): JSX.Element {
	// 挂载的文件夹名取第一个挂载点（多对多时卡片只标注一个位置）
	const folderName = agentsMd.folderIds.map((folderId) => folderNames[folderId]).filter(Boolean)[0];

	return (
		<Card size="sm" className="relative transition hover:ring-foreground/25">
			<CardHeader>
				<CardTitle>
					<button
						type="button"
						onClick={() => onOpen(agentsMd.id)}
						className="cursor-pointer outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
					>
						{agentsMd.name}
					</button>
				</CardTitle>
				<CardDescription className="line-clamp-2">{agentsMd.excerpt}</CardDescription>
			</CardHeader>
			<CardFooter className="gap-1.5 text-muted-foreground text-xs">
				<Icons.folderClosed className="size-3.5 shrink-0" />
				<span className="truncate font-mono">{folderName || "项目根"}</span>
			</CardFooter>
		</Card>
	);
}
