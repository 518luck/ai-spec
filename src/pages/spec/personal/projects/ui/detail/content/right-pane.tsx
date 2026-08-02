"use client";

// # 项目详情右侧鸟瞰图：空文件夹 / 卡片列表 两态（编辑器视图由 detail-client 直接渲染）

import type { JSX } from "react";

import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { Icons } from "@/shared/ui/icons";
import { EmptyState } from "@/widgets/empty-state";
import { AgentsMdCardGrid } from "./agents-md-cards";

interface RightPaneProps {
	/** 当前选中文件夹下的全部配置（搜索态为后端搜索结果） */
	folderAgentsMds: AgentsMdListItemVo[];
	/** 文件夹 id → 名称映射（卡片底部标注挂载位置用） */
	folderNames: Record<string, string>;
	/** 配置 id → 项目名映射（全项目搜索时标注项目归属；本项目搜索为 undefined） */
	projectNames?: Record<string, string>;
	/** 空列表提示文案（搜索无结果时用搜索专用文案） */
	emptyHint?: string;
	/** 鸟瞰图点卡片：打开配置进入编辑器 */
	onOpenAgentsMd: (agentsMdId: string) => void;
}

// 右侧主体：空文件夹 / 鸟瞰图卡片列表 两态，扁平化避免嵌套三元
export function RightPane({
	folderAgentsMds,
	folderNames,
	projectNames,
	emptyHint,
	onOpenAgentsMd,
}: RightPaneProps): JSX.Element {
	if (folderAgentsMds.length === 0) {
		return (
			<EmptyState
				icon={Icons.agentsMd}
				description={emptyHint ?? "该文件夹下还没有 AGENTS.md 配置"}
			/>
		);
	}

	// 鸟瞰图：卡片网格（切换为编辑器的入口在标题栏右端）
	return (
		<div className="scrollbar-thin h-full overflow-auto">
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
