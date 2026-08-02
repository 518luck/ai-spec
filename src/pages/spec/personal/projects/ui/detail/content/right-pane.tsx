"use client";

// # 项目详情右侧主体：配置阅读 / 加载中 / 空文件夹 / 卡片列表 四态切换

import { useQuery } from "@tanstack/react-query";
import type { JSX } from "react";

import { client } from "@/shared/lib/orpc/client";
import { projectKeys } from "@/shared/lib/orpc/query-keys";
import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { EmptyState } from "@/widgets/empty-state";
import { AgentsMdCardGrid } from "./agents-md-cards";

interface RightPaneProps {
	projectId: string;
	/** 当前阅读的配置（含所属项目 id：全项目搜索打开的其他项目配置，取全文用其项目 id）；null 表示停留在配置卡片列表 */
	openedAgentsMd: { id: string; projectId: string } | null;
	/** 当前选中文件夹下的全部配置（搜索态为后端搜索结果） */
	folderAgentsMds: AgentsMdListItemVo[];
	/** 文件夹 id → 名称映射（卡片底部标注挂载位置用） */
	folderNames: Record<string, string>;
	/** 配置 id → 项目名映射（全项目搜索时标注项目归属；本项目搜索为 undefined） */
	projectNames?: Record<string, string>;
	/** 空列表提示文案（搜索无结果时用搜索专用文案） */
	emptyHint?: string;
	/** 打开某份配置进入阅读态 */
	onOpenAgentsMd: (agentsMdId: string) => void;
}

// 右侧主体：配置阅读 / 加载中 / 空文件夹 / 卡片列表 四种状态，扁平化避免嵌套三元
export function RightPane({
	projectId,
	openedAgentsMd,
	folderAgentsMds,
	folderNames,
	projectNames,
	emptyHint,
	onOpenAgentsMd,
}: RightPaneProps): JSX.Element {
	// 阅读态：取配置全文（仅打开配置时请求）；queryKey 带所属项目 id（跨项目打开时缓存隔离）
	const { data: agentsMd, isLoading } = useQuery({
		queryKey: projectKeys.agentsMdContent(
			openedAgentsMd?.projectId ?? projectId,
			openedAgentsMd?.id ?? "",
		),
		queryFn: () =>
			client.agentsMds.getById({
				projectId: openedAgentsMd?.projectId ?? projectId,
				id: openedAgentsMd?.id ?? "",
			}),
		enabled: Boolean(openedAgentsMd),
	});

	if (openedAgentsMd) {
		if (isLoading || !agentsMd) {
			return (
				<div className="flex min-h-60 flex-1 items-center justify-center">
					<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
				</div>
			);
		}
		return (
			<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
				<pre className="whitespace-pre-wrap px-6 py-4 font-mono text-sm leading-6">
					{agentsMd.content}
				</pre>
			</div>
		);
	}

	if (folderAgentsMds.length === 0) {
		return (
			<EmptyState
				icon={Icons.agentsMd}
				description={emptyHint ?? "该文件夹下还没有 AGENTS.md 配置"}
			/>
		);
	}

	return (
		<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
			<div className="px-6 py-4">
				<AgentsMdCardGrid
					agentsMds={folderAgentsMds}
					folderNames={folderNames}
					projectNames={projectNames}
					onOpen={onOpenAgentsMd}
				/>
			</div>
		</div>
	);
}
