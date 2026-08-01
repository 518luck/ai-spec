"use client";

// # VSCode 风格文件夹树：headless-tree 管理展开/选中/焦点/键盘导航，只渲染文件夹，点击上抛选中

import type { ItemInstance } from "@headless-tree/core";
import {
	expandAllFeature,
	hotkeysCoreFeature,
	selectionFeature,
	syncDataLoaderFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import Image from "next/image";
import type { JSX } from "react";
import { cn } from "@/shared/lib/utils";
import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import {
	collectFolderAgentsMds,
	getSubfolderIds,
	PROJECT_TREE_ROOT_ID,
	type ProjectTreeNode,
} from "../../../model/path-utils";
import type { FolderIconPair } from "../folder-icons";

interface FileTreeProps {
	/** 当前打开的项目 id，树只展示该项目的文件夹；切换项目时用 key 重挂载 */
	projectId: string;
	/** 项目内文件夹树（由扁平文档列表按 path 前缀推导） */
	tree: Record<string, ProjectTreeNode>;
	/** 项目全部文档（用于计算各文件夹子树的文档数角标） */
	agentsMds: AgentsMdListItemVo[];
	/** 当前选中的文件夹 id（受控）：面包屑等外部跳转时树高亮同步 */
	selectedFolderId: string;
	/** 展开的文件夹集合（受控）：面包屑跳转深层文件夹时由页面补齐祖先路径 */
	expandedFolderIds: string[];
	/** 展开状态变更回传（树内点击箭头/行触发），签名兼容 React 的 setState */
	onExpandedChange: (updater: string[] | ((old: string[]) => string[])) => void;
	/** 点击文件夹时上抛其 id，供右侧卡片区联动 */
	onFolderSelect: (folderId: string) => void;
	/** 服务端预解析的各文件夹图标对，按 itemId 索引 */
	iconsMap: Record<string, FolderIconPair>;
	/** 通用兜底图标对（未命中 iconsMap 时使用） */
	defaultIconPair: FolderIconPair;
}

export function FileTree({
	projectId,
	tree,
	agentsMds,
	selectedFolderId,
	expandedFolderIds,
	onExpandedChange,
	onFolderSelect,
	iconsMap,
	defaultIconPair,
}: FileTreeProps): JSX.Element {
	const treeApi = useTree<ProjectTreeNode>({
		rootItemId: PROJECT_TREE_ROOT_ID,
		getItemName: (item) => item.getItemData().name,
		// 有子文件夹才可展开、显示箭头；文件不进树，末级文件夹按叶节点处理
		isItemFolder: (item) => getSubfolderIds(item.getId(), tree).length > 0,
		dataLoader: {
			getItem: (itemId) => tree[itemId],
			// 根下只挂当前项目，让项目文件夹本身成为树的第一行（选中可看项目全部文档）
			getChildren: (itemId) =>
				itemId === PROJECT_TREE_ROOT_ID ? [projectId] : getSubfolderIds(itemId, tree),
		},
		// 选中与展开都受页面控制：树内交互经 setXxx 上抛，外部（面包屑）跳转时高亮与展开自动同步
		state: {
			selectedItems: [selectedFolderId],
			expandedItems: expandedFolderIds,
		},
		setExpandedItems: onExpandedChange,
		setSelectedItems: (updater) => {
			const next = typeof updater === "function" ? updater([selectedFolderId]) : updater;
			const [folderId] = next;
			if (folderId) onFolderSelect(folderId);
		},
		// 单击/回车：展开收起由内建逻辑处理，这里把选中的文件夹上抛
		onPrimaryAction: (item) => onFolderSelect(item.getId()),
		features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature, expandAllFeature],
	});

	return (
		<div className="flex flex-col">
			{/* // @ 顶部工具条：全部展开 / 全部收起 */}
			<div className="flex items-center justify-between px-3 pt-2">
				<span className="text-muted-foreground text-xs">文件夹</span>
				<div className="flex items-center">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="全部展开"
						onClick={() => void treeApi.expandAll()}
					>
						<Icons.expandAll className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="全部收起"
						onClick={() => treeApi.collapseAll()}
					>
						<Icons.collapseAll className="size-4" />
					</Button>
				</div>
			</div>
			<div
				{...treeApi.getContainerProps("项目文档文件夹树")}
				className="flex flex-col gap-px p-2 outline-none"
			>
				{treeApi.getItems().map((item) => (
					<FileTreeRow
						key={item.getId()}
						item={item}
						tree={tree}
						agentsMds={agentsMds}
						iconsMap={iconsMap}
						defaultIconPair={defaultIconPair}
					/>
				))}
			</div>
		</div>
	);
}

// 单行节点：层级缩进 + 展开箭头 + material-icon-theme 文件夹图标 + 名称 + 子树内文档数角标
function FileTreeRow({
	item,
	tree,
	agentsMds,
	iconsMap,
	defaultIconPair,
}: {
	item: ItemInstance<ProjectTreeNode>;
	tree: Record<string, ProjectTreeNode>;
	agentsMds: AgentsMdListItemVo[];
	iconsMap: Record<string, FolderIconPair>;
	defaultIconPair: FolderIconPair;
}): JSX.Element {
	const isExpanded = item.isExpanded();
	const { level } = item.getItemMeta();
	// 图标对由服务端按 itemId 预解析传入，未命中（动态新增的文件夹等）回退通用文件夹
	const iconPair = iconsMap[item.getId()] ?? defaultIconPair;
	const iconSrc = isExpanded ? iconPair.open : iconPair.closed;
	// 该文件夹子树内（含各层子文件夹）的 AGENTS.md 数量
	const docCount = collectFolderAgentsMds(item.getId(), tree, agentsMds).length;

	return (
		<button
			{...item.getProps()}
			type="button"
			// 依层级缩进模拟目录树；数值随 level 动态计算，只能用行内样式
			style={{ paddingLeft: `${level * 16 + 8}px` }}
			className={cn(
				"flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md pr-2 text-sm outline-none",
				"hover:bg-accent/60 focus-visible:ring-1 focus-visible:ring-ring",
				item.isSelected() && "bg-accent text-accent-foreground",
			)}
		>
			<Icons.chevronRight
				className={cn(
					"size-3.5 shrink-0 text-muted-foreground transition-transform",
					isExpanded && "rotate-90",
					!item.isFolder() && "invisible",
				)}
			/>
			{/* // > 本地 SVG 小图标不走优化器：unoptimized 直出原文件 */}
			<Image src={iconSrc} alt="" width={16} height={16} unoptimized className="size-4 shrink-0" />
			<span className="truncate">{item.getItemName()}</span>
			{docCount > 0 ? (
				<span className="ml-auto text-muted-foreground text-xs tabular-nums">{docCount}</span>
			) : null}
		</button>
	);
}
