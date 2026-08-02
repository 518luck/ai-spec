"use client";

// # AGENTS.md 配置卡片网格：基于 ContentCard 壳，整卡点击进入编辑器；底部标注挂载位置/项目归属

import type { JSX } from "react";

import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { ContentCard } from "@/shared/ui/content-card";
import { Icons } from "@/shared/ui/icons";

interface AgentsMdCardGridProps {
	agentsMds: AgentsMdListItemVo[];
	/** 文件夹 id → 名称映射（卡片底部标注挂载位置用） */
	folderNames: Record<string, string>;
	/** 配置 id → 项目名映射（全项目搜索时标注项目归属；本项目为 undefined） */
	projectNames?: Record<string, string>;
	/** 点击卡片时上抛配置 id，右侧切换为编辑器视图 */
	onOpen: (agentsMdId: string) => void;
}

export function AgentsMdCardGrid({
	agentsMds,
	folderNames,
	projectNames,
	onOpen,
}: AgentsMdCardGridProps): JSX.Element {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{agentsMds.map((agentsMd) => (
				<AgentsMdCard
					key={agentsMd.id}
					agentsMd={agentsMd}
					folderNames={folderNames}
					projectNames={projectNames}
					onOpen={onOpen}
				/>
			))}
		</div>
	);
}

interface AgentsMdCardProps {
	agentsMd: AgentsMdListItemVo;
	folderNames: Record<string, string>;
	projectNames?: Record<string, string>;
	onOpen: (agentsMdId: string) => void;
}

// 单张卡片：整卡点击进编辑器；底部标注挂载的文件夹名（全项目搜索时标注项目名）
function AgentsMdCard({
	agentsMd,
	folderNames,
	projectNames,
	onOpen,
}: AgentsMdCardProps): JSX.Element {
	// 挂载的文件夹名取第一个挂载点（多对多时卡片只标注一个位置）；全项目搜索结果无文件夹上下文，改用项目名
	const folderName = agentsMd.folderIds.map((folderId) => folderNames[folderId]).filter(Boolean)[0];
	const location = projectNames?.[agentsMd.id] ?? folderName ?? "项目根";

	return (
		<ContentCard
			name={agentsMd.name}
			preview={agentsMd.excerpt}
			previewClassName="font-mono"
			onClick={() => onOpen(agentsMd.id)}
			clickAriaLabel="打开"
			footer={
				<span className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
					<Icons.folderClosed className="size-3.5 shrink-0" />
					<span className="truncate font-mono">{location}</span>
				</span>
			}
		/>
	);
}
