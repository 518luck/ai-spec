"use client";

// # 项目内视图客户端容器：持有选中/展开/阅读/搜索状态，渲染面包屑 + 文件夹树 + 配置区
// > 数据流自上而下：URL 输入 → 状态 → 派生 → 查询 → 回调 → UI 计算 → JSX

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchInput } from "@/features/search-input";
import { useInertialScroll, useSessionStorage } from "@/shared/hooks";
import { client } from "@/shared/lib/orpc/client";
import { decodeFilters, type SearchFilters } from "@/shared/lib/search-filter-codec";
import type {
	AgentsMdListItemVo,
	AgentsMdSearchFieldKey,
	ProjectFolderListItemVo,
} from "@/shared/lib/zod/schemas/project";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { TitlePageShell } from "@/widgets/page-shell";
import {
	buildProjectTree,
	collectFolderAgentsMds,
	getFolderAncestorIds,
} from "../../model/path-utils";
import { RightPane } from "./content";
import type { FolderIconPair } from "./folder-icons";
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

// > 客户端交互岛屿：选中文件夹 / 阅读配置 / 展开节点均在此管理，配置树由服务端快照内存构建
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
	// 当前阅读的配置（含所属项目 id：全项目搜索打开的可能属于其他项目，取全文必须用项目自己的 id）
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

	// @ URL 输入：搜索词 + 筛选条件（字段开关/范围）解码
	const searchParams = useSearchParams();
	const searchQuery = searchParams?.get("q") ?? "";
	const searchFilters: SearchFilters = useMemo(
		() => decodeFilters(searchParams?.get("filter") ?? undefined) ?? {},
		[searchParams],
	);
	// 搜索范围：缺省本项目；参与搜索的字段：按开关收集（title 开关对应后端的 name 字段——配置以文件名为标识）
	const searchScope = searchFilters.scope ?? "project";
	const searchFields = useMemo(() => {
		const fields: AgentsMdSearchFieldKey[] = [];
		if (searchFilters.title) fields.push("name");
		if (searchFilters.content) fields.push("content");
		return fields;
	}, [searchFilters]);
	// 字段 join 成字符串作 queryKey 的一部分（数组引用不稳定，直接作 key 会多请求）
	const searchFieldsKey = searchFields.join(",");

	// @ 派生：内存树 + 当前文件夹配置
	const tree = useMemo(
		() => buildProjectTree(projectFolders, agentsMds, rootFolderId, projectName),
		[projectFolders, agentsMds, rootFolderId, projectName],
	);
	const folderAgentsMds = useMemo(
		() => collectFolderAgentsMds(selectedFolderId, tree, agentsMds),
		[selectedFolderId, tree, agentsMds],
	);

	// @ 搜索查询：关键词非空时启用；本项目走 list（带 q/fields），全项目走 listAll（跨全部项目）
	//   "搜内容"需要 content 全文，前端预取只有 name+excerpt，因此必须后端搜索
	//   两个查询按 scope 互斥启用（enabled 带 scope 判断），data 类型各自明确
	const isAllScope = searchScope === "all";
	const searchEnabled = Boolean(searchQuery.trim());
	const { data: allScopeResults } = useQuery({
		queryKey: ["agentsMd-search", projectId, searchScope, searchQuery, searchFieldsKey],
		queryFn: () => client.agentsMds.listAll({ q: searchQuery, fields: searchFields }),
		enabled: searchEnabled && isAllScope,
	});
	const { data: projectResults } = useQuery({
		queryKey: ["agentsMd-search", projectId, searchScope, searchQuery, searchFieldsKey],
		queryFn: () => client.agentsMds.list({ projectId, q: searchQuery, fields: searchFields }),
		enabled: searchEnabled && !isAllScope,
	});
	// 当前生效的搜索结果（未搜索时为空数组，展示层回退到文件夹子树）
	const searchResults = isAllScope ? allScopeResults : projectResults;

	// @ 派生：展示列表（搜索态为后端结果，否则为当前文件夹子树）、项目名映射、文件夹名映射
	const visibleAgentsMds = useMemo(() => {
		if (!searchEnabled) return folderAgentsMds;
		return searchResults ?? [];
	}, [searchEnabled, folderAgentsMds, searchResults]);
	// 全项目搜索时：docId → 项目名（卡片底部标注项目归属）；本项目搜索仍用文件夹名映射
	const projectNames = useMemo(() => {
		if (!isAllScope) return undefined;
		return Object.fromEntries((allScopeResults ?? []).map((item) => [item.id, item.projectName]));
	}, [isAllScope, allScopeResults]);
	// 文件夹 id → 名称映射（卡片底部标注挂载位置用）
	const folderNames = useMemo(
		() => Object.fromEntries(projectFolders.map((folder) => [folder.id, folder.name])),
		[projectFolders],
	);

	// @ 回调：切换文件夹 / 打开配置 / 编辑器返回与保存 / 视图切换 / 创建删除联动
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

	// 编辑器保存成功后刷新服务端数据：树/卡片同步改名
	const handleSaved = (): void => {
		router.refresh();
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

	// @ UI 计算：标题栏视图切换按钮、面包屑横滚
	// > 编辑器内可切回鸟瞰图；鸟瞰图仅单卡时可切编辑器（多卡编辑入口靠点卡片）
	const renderViewSwitchButton = (): JSX.Element | null => {
		if (openedAgentsMd !== null) {
			return (
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="切换为鸟瞰图"
					onClick={handleBackFromEditor}
					className="absolute right-0"
				>
					<Icons.viewGrid className="size-4" />
				</Button>
			);
		}
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

	// 面包屑横滚：滚轮划过去横向滚动（rAF 惯性），不触发页面纵向滚动；内容未溢出时自动放行页面滚动
	const breadcrumbScrollRef = useRef<HTMLDivElement>(null);
	useInertialScroll(breadcrumbScrollRef, { direction: "horizontal" });

	return (
		<TitlePageShell
			// 标题栏不放标题：居中搜索框 + 右端视图切换按钮；面包屑在下方独立栏
			title={
				<div className="relative flex w-full items-center justify-center">
					{/* 项目内搜索：字段可多选（标题/内容），特殊字段 scope 启用范围单选（本项目/全项目） */}
					<SearchInput
						className="max-w-sm"
						filters={["title", "content", "scope"]}
						defaultFilter="title"
					/>
					{/* 视图切换按钮：渲染函数 renderViewSwitchButton 按状态提前 return */}
					{renderViewSwitchButton()}
				</div>
			}
			scrollable={false}
		>
			<div className="flex min-h-0 flex-1">
				{/* // @ 左侧：文件夹树侧栏（宽度可拖拽调整，VSCode 风格；会话级持久化） */}
				<aside
					data-slot="detail-sidebar"
					className="relative flex min-h-0 shrink-0 flex-col border-r"
					style={{ width: sidebarWidth }}
				>
					<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
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
				{/* // @ 右侧内容区：面包屑独立栏（只占本区域，滚轮横向滚动，VSCode 风格）+ 配置卡片列表 / 配置阅读 */}
				<section className="flex min-w-0 flex-1 flex-col">
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
					<RightPane
						openedAgentsMd={openedAgentsMd}
						folderAgentsMds={visibleAgentsMds}
						folderNames={folderNames}
						projectNames={projectNames}
						emptyHint={searchQuery.trim() ? "未找到匹配的配置" : undefined}
						onOpenAgentsMd={handleOpenAgentsMd}
						onBackFromEditor={handleBackFromEditor}
						onSaved={handleSaved}
					/>
				</section>
			</div>
		</TitlePageShell>
	);
}
