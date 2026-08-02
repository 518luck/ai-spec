"use client";

// # 项目内视图客户端容器：持有选中/展开/阅读/搜索/编辑器状态，渲染面包屑 + 文件夹树 + 配置区
// > 数据流自上而下：状态 → 派生 → hook（搜索/编辑器数据流）→ 回调 → UI 计算 → JSX
// > 编辑器状态栏直接渲染在标题栏（省去独立状态栏行）：编辑器态标题栏为 返回/名称/快捷栏/保存，列表态为搜索框

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MarkdownEditor, QuickToolbar } from "@/features/markdown-editor";
import { SearchInput } from "@/features/search-input";
import { useInertialScroll, useSessionStorage } from "@/shared/hooks";
import type { AgentsMdListItemVo, ProjectFolderListItemVo } from "@/shared/lib/zod/schemas/project";
import { Button } from "@/shared/ui/button";
import { DoubleEditableInput } from "@/shared/ui/double-editable-input";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { TitlePageShell } from "@/widgets/page-shell";
import {
	buildProjectTree,
	collectFolderAgentsMds,
	getFolderAncestorIds,
} from "../../model/path-utils";
import { RightPane } from "./content";
import type { FolderIconPair } from "./folder-icons";
import { useAgentsMdEditor } from "./model/use-agents-md-editor";
import { useAgentsMdSearch } from "./model/use-agents-md-search";
import { BreadcrumbNav, FileTree, SidebarResizeHandle } from "./nav";

interface ProjectDetailClientProps {
	/** 当前打开的项目 id（来自 URL 参数） */
	projectId: string;
	/** 项目名，作为树根的显示名 */
	projectName: string;
	/** 服务端预取的 AGENTS.md 配置列表（含多对多挂载关系） */
	agentsMds: AgentsMdListItemVo[];
	/** 服务端预取的文件夹列表（parentId 自关联树） */
	projectFolders: ProjectFolderListItemVo[];
	/** 项目根文件夹 id（parentId=null 的记录）：树第一行与顶层挂载点 */
	rootFolderId: string;
	/** 服务端预解析的各文件夹图标对，按 itemId 索引 */
	iconsMap: Record<string, FolderIconPair>;
	/** 通用兜底图标对（未命中 iconsMap 时使用） */
	defaultIconPair: FolderIconPair;
}

// > 客户端交互岛屿：选中文件夹 / 打开配置 / 编辑保存 / 展开节点均在此管理，配置树由服务端快照内存构建
export function ProjectDetailClient({
	projectId,
	projectName,
	agentsMds,
	projectFolders,
	rootFolderId,
	iconsMap,
	defaultIconPair,
}: ProjectDetailClientProps): JSX.Element {
	const router = useRouter();

	// @ 状态：树选中/展开、编辑器打开、侧栏宽度
	// 左侧树选中的文件夹；进入时默认选中项目根文件夹
	const [selectedFolderId, setSelectedFolderId] = useState<string>(rootFolderId);
	// 当前打开的配置（含所属项目 id：全项目搜索打开的可能属于其他项目，取全文必须用项目自己的 id）
	// > 默认视图规则：项目只有一条配置时直接进编辑器打开它，多条/零条进鸟瞰图
	const [openedAgentsMd, setOpenedAgentsMd] = useState<{ id: string; projectId: string } | null>(
		() => (agentsMds.length === 1 ? { id: agentsMds[0].id, projectId } : null),
	);
	// 树中展开的文件夹集合（受控），面包屑跳转时补齐祖先路径
	// > 存 sessionStorage（按项目隔离），刷新后恢复展开状态，关标签页清空
	const [expandedFolderIds, setExpandedFolderIds] = useSessionStorage<string[]>(
		`project:${projectId}:expanded`,
		[rootFolderId],
	);
	// 文件夹树侧栏宽度（px）：会话级持久化、全局生效（VSCode 拖拽调宽后保持）
	const [sidebarWidth, setSidebarWidth] = useSessionStorage<number>(
		"projects:detail:sidebarWidth",
		256,
	);

	// @ 派生：内存树 + 当前文件夹配置 + 文件夹名映射
	const tree = useMemo(
		() => buildProjectTree(projectFolders, agentsMds, rootFolderId, projectName),
		[projectFolders, agentsMds, rootFolderId, projectName],
	);
	const folderAgentsMds = useMemo(
		() => collectFolderAgentsMds(selectedFolderId, tree, agentsMds),
		[selectedFolderId, tree, agentsMds],
	);
	const folderNames = useMemo(
		() => Object.fromEntries(projectFolders.map((folder) => [folder.id, folder.name])),
		[projectFolders],
	);

	// @ 数据流 hook：搜索（URL 解码 + 双范围查询 + 展示列表）、编辑器（全文 + 表单 + 保存）
	const { searchQuery, isAllScope, visibleAgentsMds, projectNames, allScopeResults } =
		useAgentsMdSearch(projectId, folderAgentsMds);
	const {
		editName,
		setEditName,
		editContent,
		setEditContent,
		isSaving,
		isLoading,
		mounted,
		editorRef,
		handleSave,
	} = useAgentsMdEditor(openedAgentsMd);

	// @ 回调：切换文件夹 / 打开配置 / 编辑器返回 / 视图切换 / 创建删除联动 / 搜索回列表
	// 切换文件夹（树点击或面包屑跳转）：右侧退回该文件夹的配置卡片列表，并展开目标路径上的全部祖先
	const handleFolderSelect = (folderId: string): void => {
		setSelectedFolderId(folderId);
		setOpenedAgentsMd(null);
		setExpandedFolderIds((prev) => [
			...new Set([...prev, ...getFolderAncestorIds(folderId, tree)]),
		]);
	};

	// > 打开配置：全项目搜索时按结果项定位其所属项目（可能不是当前项目），其余场景用当前项目
	const handleOpenAgentsMd = (id: string): void => {
		if (isAllScope) {
			const item = (allScopeResults ?? []).find((result) => result.id === id);
			setOpenedAgentsMd(item ? { id, projectId: item.projectId } : { id, projectId });
		} else {
			setOpenedAgentsMd({ id, projectId });
		}
	};

	// 编辑器返回鸟瞰图
	const handleBackFromEditor = (): void => {
		setOpenedAgentsMd(null);
	};

	// 标题栏"切换为编辑器"：打开当前展示列表第一条（搜索态为搜索结果，否则为当前文件夹配置）
	const handleSwitchToEditor = (): void => {
		const first = visibleAgentsMds[0];
		if (first) setOpenedAgentsMd({ id: first.id, projectId });
	};

	// 创建文件/文件夹成功后的联动：展开新路径祖先，文件夹创建后选中它（右侧联动），再刷新服务端数据
	const handleCreated = (id: string, kind: "file" | "folder"): void => {
		if (kind === "folder") {
			setExpandedFolderIds((prev) => [...new Set([...prev, ...getFolderAncestorIds(id, tree)])]);
			setSelectedFolderId(id);
			setOpenedAgentsMd(null);
		}
		// 创建文件时父文件夹即当前选中项（已展开），无需额外展开
		// RSC 预取快照模式：router.refresh() 触发服务端重新执行预取，树/卡片拿到最新数据
		router.refresh();
	};

	// 删除文件夹成功后的联动：若删的是当前选中文件夹则回退选中其父（无父回根），再刷新服务端数据
	const handleDeleted = (folderId: string, parentId: string | null): void => {
		if (selectedFolderId === folderId) {
			setSelectedFolderId(parentId ?? rootFolderId);
			setOpenedAgentsMd(null);
			setExpandedFolderIds((prev) => prev.filter((id) => id !== folderId));
		}
		router.refresh();
	};

	// > 搜索词变化时关闭编辑器回到鸟瞰图：搜索态强制列表展示（结果卡片可点开进编辑器）
	//   用 ref 记录上次词：跳过首帧，避免覆盖"单配置默认打开编辑器"的初始状态
	const prevSearchQueryRef = useRef(searchQuery);
	useEffect(() => {
		if (prevSearchQueryRef.current === searchQuery) return;
		prevSearchQueryRef.current = searchQuery;
		setOpenedAgentsMd(null);
	}, [searchQuery]);

	// @ UI 计算：标题栏视图切换按钮、标题栏双态、面包屑横滚
	// > 编辑器内用状态栏的返回按钮回列表；列表态仅单卡时可切编辑器（多卡编辑入口靠点卡片）
	const renderViewSwitchButton = (): JSX.Element | null => {
		if (visibleAgentsMds.length !== 1) return null;
		return (
			<Button
				variant="ghost"
				size="icon-sm"
				aria-label="切换为编辑器"
				onClick={handleSwitchToEditor}
				className="absolute right-0"
			>
				<Icons.code className="size-4" />
			</Button>
		);
	};

	// > 标题栏内容：编辑器态渲染状态栏（返回/名称在左，快捷栏/保存在右），列表态渲染居中搜索框 + 右端切换按钮
	const renderTitleBar = (): JSX.Element => {
		if (openedAgentsMd) {
			return (
				<div className="flex w-full items-center gap-2">
					{/* // 左侧：返回 + 名称（双击修改，纯文本无底色） */}
					<Button variant="ghost" size="icon-sm" aria-label="返回" onClick={handleBackFromEditor}>
						<Icons.chevronLeft className="size-4" />
					</Button>
					<DoubleEditableInput
						value={editName}
						onCommit={setEditName}
						placeholder="配置名称"
						textClassName="h-7 text-sm"
						// 编辑态输入框限宽，避免撑满标题栏
						inputClassName="h-7 max-w-64"
					/>
					{/* // 右侧：快捷栏 + 保存（ml-auto 推右） */}
					<div className="ml-auto flex items-center gap-2">
						{mounted ? <QuickToolbar editorRef={editorRef} isExpanded /> : null}
						<Button size="sm" disabled={isSaving} onClick={handleSave}>
							{isSaving ? "保存中..." : "保存"}
						</Button>
					</div>
				</div>
			);
		}
		return (
			<div className="relative flex w-full items-center justify-center">
				{/* 项目内搜索：字段可多选（标题/内容），特殊字段 scope 启用范围单选（本项目/全项目） */}
				<SearchInput
					className="max-w-sm"
					filters={["title", "content", "scope"]}
					defaultFilter="title"
				/>
				{renderViewSwitchButton()}
			</div>
		);
	};

	// 面包屑横滚：滚轮划过去横向滚动（rAF 惯性），不触发页面纵向滚动；内容未溢出时自动放行页面滚动
	const breadcrumbScrollRef = useRef<HTMLDivElement>(null);
	useInertialScroll(breadcrumbScrollRef, { direction: "horizontal" });

	return (
		<TitlePageShell
			// 标题栏双态：编辑器态 = 编辑器状态栏；列表态 = 居中搜索框
			// > 标题栏浮层：不占布局高度，内容从页面顶端起算，滚动时穿过半透明标题栏（VSCode 效果）
			//   树滚动区与 section 各自 pt-16 让位，首行不被遮住
			title={renderTitleBar()}
			scrollable={false}
			floatingHeader
		>
			<div className="flex min-h-0 flex-1">
				{/* // @ 左侧：文件夹树侧栏（宽度可拖拽调整，VSCode 风格；会话级持久化） */}
				<aside
					data-slot="detail-sidebar"
					className="relative flex min-h-0 shrink-0 flex-col border-r"
					style={{ width: sidebarWidth }}
				>
					<div className="scrollbar-thin min-h-0 flex-1 overflow-auto pt-16">
						{/* 数据指纹作 key：创建/刷新后数量变化即重挂载，headless-tree 受控模式下数据变化
					    不会刷新已展开节点的子列表，重挂载让新节点立即可见 */}
						<FileTree
							key={`${projectId}:${projectFolders.length}:${agentsMds.length}`}
							projectId={projectId}
							tree={tree}
							agentsMds={agentsMds}
							selectedFolderId={selectedFolderId}
							expandedFolderIds={expandedFolderIds}
							onExpandedChange={setExpandedFolderIds}
							onFolderSelect={handleFolderSelect}
							onCreated={handleCreated}
							onDeleted={handleDeleted}
							iconsMap={iconsMap}
							defaultIconPair={defaultIconPair}
						/>
					</div>
					{/* // 缩放手柄：贴 aside 右边缘，拖拽调整文件夹树宽度 */}
					<SidebarResizeHandle width={sidebarWidth} onWidthChange={setSidebarWidth} />
				</aside>
				{/* // @ 右侧内容区：面包屑独立栏（只占本区域，滚轮横向滚动，VSCode 风格）+ 编辑器内容区 / 鸟瞰图 */}
				<section className="flex min-w-0 flex-1 flex-col pt-16">
					<div
						ref={breadcrumbScrollRef}
						className="flex h-7 shrink-0 items-center overflow-x-auto border-b px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					>
						<BreadcrumbNav
							tree={tree}
							agentsMds={agentsMds}
							currentId={openedAgentsMd?.id ?? selectedFolderId}
							onNavigateHome={() => router.back()}
							onNavigateFolder={handleFolderSelect}
						/>
					</div>
					{openedAgentsMd ? (
						// 编辑器内容区：MarkdownEditor 撑满剩余高度；预览态内部 ScrollArea，编辑态 CodeMirror 自滚
						<div className="min-h-0 flex-1 overflow-hidden">
							{isLoading ? (
								<div className="flex min-h-60 flex-1 items-center justify-center">
									<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
								</div>
							) : (
								<MarkdownEditor
									ref={editorRef}
									value={editContent}
									onChange={setEditContent}
									// > 编辑器滚动区在面包屑下方、无浮层遮挡：覆盖全局样式的 pt-48px（浮层场景让位用），文本贴顶；左右 padding 与预览态对齐
									editorClassName="[&_.cm-scroller]:px-6! [&_.cm-scroller]:pt-0!"
									previewClassName="px-6 py-4"
									onSubmitShortcut={handleSave}
								/>
							)}
						</div>
					) : (
						<RightPane
							folderAgentsMds={visibleAgentsMds}
							folderNames={folderNames}
							projectNames={projectNames}
							emptyHint={searchQuery.trim() ? "未找到匹配的配置" : undefined}
							onOpenAgentsMd={handleOpenAgentsMd}
						/>
					)}
				</section>
			</div>
		</TitlePageShell>
	);
}
