"use client";

// # VSCode 风格文件夹树：headless-tree 管理展开/选中/焦点/键盘导航，只渲染文件夹，点击上抛选中

import type { ItemInstance } from "@headless-tree/core"; // 树节点实例类型（封装单节点的状态查询与事件绑定）
import {
	expandAllFeature, // 全部展开/收起能力（treeApi.expandAll / collapseAll）
	hotkeysCoreFeature, // 键盘导航（上下左右/回车，对应 VSCode 文件树快捷键）
	selectionFeature, // 选中态管理（单选高亮、setSelectedItems 受控）
	syncDataLoaderFeature, // 同步数据加载（getItem/getChildren 直接返回数据，非异步）
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react"; // React 绑定：useTree hook 把配置转成 treeApi
import { AnimatePresence, motion } from "motion/react"; // 图标切换的淡入淡出
import Image from "next/image";
import type { JSX } from "react";
import { useSessionStorage } from "@/shared/hooks";
import { cn } from "@/shared/lib/utils";
import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import {
	collectFolderAgentsMds,
	getAncestorFolderIds,
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

	// 选中项的祖先链：这些层级的缩进竖线高亮（VSCode 风格，直观显示归属路径）
	const activeAncestorIds = new Set(getAncestorFolderIds(selectedFolderId, projectId));

	// 全部展开意图：记录用户是否点了"全部展开"，决定工具栏图标切换
	// > 存 sessionStorage（按项目隔离），与 expandedFolderIds 同生命周期，刷新后一致恢复
	// ! 不反推(expandedFolderIds 是否覆盖所有可展开项)：headless-tree 的 expandAll 在受控+异步模式下
	//   不会把所有深层节点都加入 expandedFolderIds，反推不可靠；直接记录用户意图
	const [isAllExpanded, setIsAllExpanded] = useSessionStorage<boolean>(
		`project:${projectId}:allExpanded`,
		false,
	);

	return (
		<div className="flex flex-col">
			{/* // @ 顶部工具条：全部展开 / 全部收起（同槽位切换，motion 淡入淡出） */}
			<div className="flex items-center justify-between px-3 pt-2">
				<span className="text-muted-foreground text-xs">文件夹</span>
				<div className="relative flex h-7 w-7 items-center justify-center">
					<AnimatePresence initial={false} mode="wait">
						{isAllExpanded ? (
							<MotionButton
								key="collapse"
								variant="ghost"
								size="icon-sm"
								aria-label="全部收起"
								initial={{ opacity: 0, scale: 0.85 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.85 }}
								transition={{ duration: 0.15, ease: "easeOut" }}
								onClick={() => {
									setIsAllExpanded(false);
									treeApi.collapseAll();
								}}
							>
								<Icons.libraryMinus className="size-4" />
							</MotionButton>
						) : (
							<MotionButton
								key="expand"
								variant="ghost"
								size="icon-sm"
								aria-label="全部展开"
								initial={{ opacity: 0, scale: 0.85 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.85 }}
								transition={{ duration: 0.15, ease: "easeOut" }}
								onClick={() => {
									setIsAllExpanded(true);
									void treeApi.expandAll();
								}}
							>
								<Icons.libraryPlus className="size-4" />
							</MotionButton>
						)}
					</AnimatePresence>
				</div>
			</div>
			<div
				{...treeApi.getContainerProps("项目文档文件夹树")}
				className="flex flex-col p-2 outline-none"
			>
				{treeApi.getItems().map((item) => (
					<FileTreeRow
						key={item.getId()}
						item={item}
						projectId={projectId}
						tree={tree}
						agentsMds={agentsMds}
						iconsMap={iconsMap}
						defaultIconPair={defaultIconPair}
						activeAncestorIds={activeAncestorIds}
					/>
				))}
			</div>
		</div>
	);
}

// 每级缩进宽度（px）：与 VSCode 默认 indent=8 对齐
const INDENT_PX = 8;

// 动效按钮：motion 包装 Button，用于工具栏图标切换时的淡入淡出
const MotionButton = motion.create(Button);

// 单行节点：缩进辅助线（祖先链 active 高亮）+ 展开箭头 + 文件夹图标 + 名称 + 子树文档数
function FileTreeRow({
	item,
	projectId,
	tree,
	agentsMds,
	iconsMap,
	defaultIconPair,
	activeAncestorIds,
}: {
	item: ItemInstance<ProjectTreeNode>;
	projectId: string;
	tree: Record<string, ProjectTreeNode>;
	agentsMds: AgentsMdListItemVo[];
	iconsMap: Record<string, FolderIconPair>;
	defaultIconPair: FolderIconPair;
	// 选中文件夹的祖先链 id 集合；命中则对应层级的竖线高亮
	activeAncestorIds: Set<string>;
}): JSX.Element {
	const isExpanded = item.isExpanded();
	// 图标对由服务端按 itemId 预解析传入，未命中（动态新增的文件夹等）回退通用文件夹
	const iconPair = iconsMap[item.getId()] ?? defaultIconPair;
	const iconSrc = isExpanded ? iconPair.open : iconPair.closed;
	// 该文件夹子树内（含各层子文件夹）的 AGENTS.md 数量
	const docCount = collectFolderAgentsMds(item.getId(), tree, agentsMds).length;

	// 当前行到项目根的祖先链（含两端）；slice(0,-1) 去掉自身，留祖先用于竖线渲染
	const ancestorIds = getAncestorFolderIds(item.getId(), projectId).slice(0, -1);
	// chevron 缩进：每多一层祖先多 INDENT_PX；项目根无祖先 → 0
	const indentPx = ancestorIds.length * INDENT_PX;

	return (
		// 外层行：无圆角、无 gap，让缩进竖线贯穿相邻行形成连续长线（VSCode .monaco-list-row 紧贴排列）
		// ! 圆角背景不能画在这一层，否则竖线会在圆角处断裂
		<div
			{...item.getProps()}
			className="relative flex h-5.5 shrink-0 cursor-pointer items-center text-sm outline-none"
		>
			{/* // @ 缩进辅助线容器：绝对定位、占满整行高度、不挡点击；每层一条 1px 竖线，选中项祖先链高亮 */}
			{/* z-10 让竖线浮于内层选中背景之上，选中时竖线仍可见（VSCode indent-guide 同理） */}
			<div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 flex">
				{ancestorIds.map((ancestorId) => (
					<span
						key={ancestorId}
						className={cn(
							"w-2 shrink-0 border-l",
							activeAncestorIds.has(ancestorId) ? "border-foreground/40" : "border-transparent",
						)}
					/>
				))}
			</div>
			{/* // @ 内层内容：圆角背景 + hover/选中态画在这里，避免外层圆角切断竖线 */}
			<div
				className={cn(
					"flex h-5 flex-1 items-center gap-1.5 rounded-md pr-2",
					"hover:bg-accent/60",
					item.isSelected() && "bg-accent text-accent-foreground",
				)}
			>
				<Icons.chevronRight
					style={{ marginLeft: indentPx }}
					className={cn(
						"size-3.5 shrink-0 text-muted-foreground transition-transform",
						isExpanded && "rotate-90",
						!item.isFolder() && "invisible",
					)}
				/>
				{/* // > 本地 SVG 小图标不走优化器：unoptimized 直出原文件 */}
				<Image
					src={iconSrc}
					alt=""
					width={16}
					height={16}
					unoptimized
					className="size-4 shrink-0"
				/>
				<span className="truncate">{item.getItemName()}</span>
				{docCount > 0 ? (
					<span className="ml-auto text-muted-foreground text-xs tabular-nums">{docCount}</span>
				) : null}
			</div>
		</div>
	);
}
