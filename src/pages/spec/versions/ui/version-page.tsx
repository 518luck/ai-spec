"use client";

// # 通用版本页：纯 UI + 交互，数据源和行为通过 props 注入，不耦合任何具体资源 API

import { type Change, diffLines } from "diff";
import { useRouter } from "next/navigation";
import { type JSX, useCallback, useMemo, useState } from "react";
import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import useSWR from "swr";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { TitlePageShell } from "@/widgets/page-shell";
import { VersionListPanel } from "./version-list-panel";

// @ 版本列表项（通用形状：调用方按此返回即可复用本页）
export interface VersionListItem {
	id: string;
	createdAt: string;
}

// @ 注入给通用版本页的数据源与行为
export interface VersionPageHandlers {
	// 当前资源 id（如 recordId）：版本数据归属的资源，用于区分不同收录的 SWR 缓存
	resourceId: string;
	// 拉版本列表（按时间倒序，第一条最新）
	fetchVersions: () => Promise<VersionListItem[]>;
	// 拉指定版本的标题与内容全文（标题用于内容区上方独立渲染，避免依赖 content 首行 markdown 语法）
	fetchVersionContent: (versionId: string) => Promise<{ title: string; content: string }>;
	// 恢复此记录：返回跳转目标 URL（带上 versionId 等），由通用页执行 router.push
	buildUseUrl: (versionId: string) => string;
}

// @ 视图模式：普通视图或 diff 视图
type ViewMode = "content" | "diff";

// @ 统一 Markdown 渲染器：GFM + 代码高亮 + 外链新窗口，普通视图与 diff 视图共用
function MarkdownView({ children }: { children: string }): JSX.Element {
	return (
		<Markdown
			remarkPlugins={[remarkGfm]}
			rehypePlugins={[
				rehypeSlug,
				[rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
				rehypeHighlight,
			]}
		>
			{children}
		</Markdown>
	);
}

export function VersionPage({ handlers }: { handlers: VersionPageHandlers }): JSX.Element {
	const { resourceId } = handlers;
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	// 视图模式：普通内容或 diff 比较
	const [viewMode, setViewMode] = useState<ViewMode>("content");

	// > 版本列表 —— 客户端 SWR 拉取（key 带 resourceId 隔离不同收录的缓存）
	const { data: versions, isLoading: listLoading } = useSWR(
		["versions", resourceId],
		handlers.fetchVersions,
		{
			// 首次加载完自动选中最新版
			onSuccess: (data) => {
				if (!selectedId && data.length > 0) {
					setSelectedId(data[0].id);
				}
			},
		},
	);

	// > 最新版本 id（列表第一条）
	const latestId = versions?.[0]?.id ?? null;

	// > 选中版本的标题与内容（客户端异步拉取）
	const { data: versionData, isLoading: contentLoading } = useSWR(
		selectedId ? ["version-content", resourceId, selectedId] : null,
		() =>
			selectedId
				? handlers.fetchVersionContent(selectedId)
				: Promise.resolve({ title: "", content: "" }),
		{ revalidateOnFocus: false },
	);
	// 解构出标题与正文：标题单独渲染到内容区上方，正文走 Markdown
	const title = versionData?.title ?? "";
	const content = versionData?.content ?? "";

	// > 最新版本内容（用于 diff 比较，只取 content 部分）
	const { data: latestVersionData } = useSWR(
		latestId ? ["version-content", resourceId, latestId] : null,
		() =>
			latestId
				? handlers.fetchVersionContent(latestId)
				: Promise.resolve({ title: "", content: "" }),
		{ revalidateOnFocus: false },
	);
	const latestContent = latestVersionData?.content ?? "";

	// > diff 结果（diff 模式下计算，无差异时返回整段未变化块，渲染为无色块内容）
	const diffChanges: Change[] | null = useMemo(() => {
		if (viewMode !== "diff" || !content || !latestContent) {
			return null;
		}
		// ! 归一化尾随换行：diffLines 在末行无换行符时会把边界行同时计入删除/新增块，
		// 导致该行在渲染时重复显示。统一补尾换行后按行干净比较。
		const normalize = (text: string) => (text.endsWith("\n") ? text : `${text}\n`);
		return diffLines(normalize(latestContent), normalize(content));
	}, [viewMode, content, latestContent]);

	// > 恢复此记录：跳转到 handler 给出的 URL
	const handleUse = useCallback(() => {
		if (!selectedId) return;
		router.push(handlers.buildUseUrl(selectedId));
	}, [router, selectedId, handlers]);

	// > 是否已有版本数据（用于区分"尚未加载"与"加载后确无版本"）
	const hasVersions = !!versions && versions.length > 0;

	// > 渲染左侧内容区（不自带滚动，由外壳的单一滚动区接管）
	const renderContent = () => {
		// 初始加载态：列表拉取中 / 有版本但尚未选中 / 内容拉取中 → 统一显示 ScaleLoader，避免误判为"暂无内容"
		if (listLoading || (hasVersions && selectedId === null) || contentLoading) {
			return (
				<div className="flex min-h-60 items-center justify-center text-muted-foreground">
					<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
				</div>
			);
		}
		if (viewMode === "diff") {
			// diff 结果尚未就绪（如最新版内容还在拉取）→ 加载态
			if (!diffChanges) {
				return (
					<div className="flex min-h-60 items-center justify-center text-muted-foreground">
						<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
					</div>
				);
			}
			// 渲染 diff：正文按差异分块用 Markdown 渲染，新增绿色、删除红色背景
			return (
				<div className="p-6">
					<article className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent">
						{diffChanges.map((change, index) => {
							// 新增/删除块着色，未变化块保持默认背景
							const diffClass = change.added
								? "bg-green-100 dark:bg-green-900/30"
								: change.removed
									? "bg-red-100 dark:bg-red-900/30"
									: "";
							// 删除块用删除线弱化，仅提示历史内容
							const textClass = change.removed
								? "text-muted-foreground line-through opacity-70"
								: "";
							return (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: diff 分块按索引渲染，顺序稳定
									key={index}
									className={`-mx-6 my-2 px-6 py-1 ${diffClass}`}
								>
									<div className={textClass}>
										<MarkdownView>{change.value}</MarkdownView>
									</div>
								</div>
							);
						})}
					</article>
				</div>
			);
		}
		if (content) {
			// 普通视图：正文走 Markdown 渲染（标题已提到顶部标题栏）
			return (
				<div className="p-6">
					<article className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent">
						<MarkdownView>{content}</MarkdownView>
					</article>
				</div>
			);
		}
		// 版本内容非空由 schema 保证，此分支业务上不可达；兜底返回 null 避免渲染异常
		return null;
	};

	return (
		<TitlePageShell
			title={
				<div className="flex w-full items-center justify-between">
					<div className="flex min-w-0 items-center gap-3">
						<Button variant="ghost" size="icon-sm" aria-label="返回" onClick={() => router.back()}>
							<Icons.chevronLeft className="size-4" />
						</Button>
						<h1 className="shrink-0 font-semibold text-lg">版本历史</h1>
						{/* 收录标题：与"版本历史"用竖线分隔，min-w-0 + truncate 防止过长标题撑爆标题栏 */}
						<div className="h-4 w-px shrink-0 bg-border" />
						<span className="truncate text-muted-foreground text-sm">{title || "加载中…"}</span>
					</div>
					<div className="flex items-center gap-1.5">
						<Tooltip>
							<TooltipTrigger
								delay={500}
								render={
									<Button
										variant={viewMode === "diff" ? "secondary" : "outline"}
										size="sm"
										onClick={() => setViewMode(viewMode === "diff" ? "content" : "diff")}
									>
										<Icons.compare className="size-4" active={viewMode === "diff"} />
										Diff
									</Button>
								}
							/>
							<TooltipContent showArrow={false}>查看与最新版本的差异</TooltipContent>
						</Tooltip>
						<Button size="sm" disabled={!selectedId || !content} onClick={handleUse}>
							恢复此记录
						</Button>
					</div>
				</div>
			}
		>
			{/* // @ 左右分栏：左栏随页面滚动，右栏用 fixed 始终钉在视口右侧 */}
			<div className="flex min-h-[calc(100vh-4rem)]">
				{/* 左侧：选中版本的只读内容，随页面滚动；右侧留出 fixed 面板的占位宽度 */}
				<div className="min-w-0 flex-1 pr-60">{renderContent()}</div>
			</div>

			{/* 右侧：版本时间列表，fixed 浮窗，始终钉在视口右侧不随页面滚动 */}
			<div className="fixed top-20 right-4 z-30 m-4 shrink-0">
				<VersionListPanel
					versions={versions}
					isLoading={listLoading}
					selectedId={selectedId}
					onSelect={setSelectedId}
				/>
			</div>
		</TitlePageShell>
	);
}
