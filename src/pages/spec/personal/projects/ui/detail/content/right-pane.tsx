"use client";

// # 项目详情右侧主体：编辑器视图（打开配置）/ 空文件夹 / 鸟瞰图卡片列表 三态切换
// > 鸟瞰图右上角提供"切换为编辑器"入口；打开某条配置后进编辑器（默认预览态）

import type { JSX } from "react";

import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { EmptyState } from "@/widgets/empty-state";
import { AgentsMdCardGrid } from "./agents-md-cards";
import { AgentsMdEditor } from "./agents-md-editor";

interface RightPaneProps {
	/** 当前打开的配置（含所属项目 id：全项目搜索打开的可能属于其他项目）；null 表示停留在鸟瞰图 */
	openedAgentsMd: { id: string; projectId: string } | null;
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
	/** 编辑器返回鸟瞰图 */
	onBackFromEditor: () => void;
	/** 编辑器保存成功后刷新（树/卡片同步改名） */
	onSaved: () => void;
	/** 鸟瞰图右上角"切换为编辑器"：打开当前列表第一条 */
	onSwitchToEditor: () => void;
}

// 右侧主体：编辑器 / 空文件夹 / 鸟瞰图卡片列表 三态，扁平化避免嵌套三元
export function RightPane({
	openedAgentsMd,
	folderAgentsMds,
	folderNames,
	projectNames,
	emptyHint,
	onOpenAgentsMd,
	onBackFromEditor,
	onSaved,
	onSwitchToEditor,
}: RightPaneProps): JSX.Element {
	// 打开配置：编辑器视图（全文 + 保存）
	if (openedAgentsMd) {
		return (
			<AgentsMdEditor
				projectId={openedAgentsMd.projectId}
				agentsMdId={openedAgentsMd.id}
				onBack={onBackFromEditor}
				onSaved={onSaved}
			/>
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

	// 鸟瞰图：卡片网格 + 右上角切换按钮（VSCode 视图切换位置）
	return (
		<div className="relative min-h-0 flex-1">
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
			<Button
				variant="ghost"
				size="icon-sm"
				aria-label="切换为编辑器"
				onClick={onSwitchToEditor}
				className="absolute top-3 right-6"
			>
				<Icons.code className="size-4" />
			</Button>
		</div>
	);
}
