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
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";
import { TitlePageShell } from "@/widgets/page-shell";
import { VersionListPanel } from "./version-list-panel";

// @ 版本列表项（通用形状：调用方按此返回即可复用本页）
export interface VersionListItem {
	id: string;
	createdAt: string;
}

// @ 注入给通用版本页的数据源与行为
export interface VersionPageHandlers {
	// 拉版本列表（按时间倒序，第一条最新）
	fetchVersions: () => Promise<VersionListItem[]>;
	// 拉指定版本的内容全文
	fetchVersionContent: (versionId: string) => Promise<string>;
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
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	// 视图模式：普通内容或 diff 比较
	const [viewMode, setViewMode] = useState<ViewMode>("content");

	// > 版本列表 —— 客户端 SWR 拉取
	const { data: versions, isLoading: listLoading } = useSWR("versions", handlers.fetchVersions, {
		// 首次加载完自动选中最新版
		onSuccess: (data) => {
			if (!selectedId && data.length > 0) {
				setSelectedId(data[0].id);
			}
		},
	});

	// > 最新版本 id（列表第一条）
	const latestId = versions?.[0]?.id ?? null;

	// > 最新版本内容（用于 diff 比较）
	const { data: latestContent } = useSWR(
		latestId ? ["version-content", latestId] : null,
		() => (latestId ? handlers.fetchVersionContent(latestId) : Promise.resolve("")),
		{ revalidateOnFocus: false },
	);

	// > 选中版本的完整内容（客户端异步拉取）
	const { data: content, isLoading: contentLoading } = useSWR(
		selectedId ? ["version-content", selectedId] : null,
		() => (selectedId ? handlers.fetchVersionContent(selectedId) : Promise.resolve("")),
		{ revalidateOnFocus: false },
	);

	// > 是否选中最新版本（最新版无需 diff）
	const isLatestSelected = selectedId === latestId;

	// > diff 结果（仅在 diff 模式且选中非最新版本时计算）
	const diffChanges: Change[] | null = useMemo(() => {
		if (viewMode !== "diff" || isLatestSelected || !content || !latestContent) {
			return null;
		}
		return diffLines(latestContent, content);
	}, [viewMode, isLatestSelected, content, latestContent]);

	// > 恢复此记录：跳转到 handler 给出的 URL
	const handleUse = useCallback(() => {
		if (!selectedId) return;
		router.push(handlers.buildUseUrl(selectedId));
	}, [router, selectedId, handlers]);

	// > 渲染左侧内容区（不自带滚动，由外壳的单一滚动区接管）
	const renderContent = () => {
		if (contentLoading) {
			return (
				<div className="flex min-h-60 items-center justify-center">
					<Spinner className="size-5" />
				</div>
			);
		}
		if (viewMode === "diff") {
			// 无 diff 结果（选中最新版）：提示无需对比
			if (!diffChanges) {
				return (
					<p className="flex min-h-60 items-center justify-center text-muted-foreground text-sm">
						当前已是最新版本，无需对比
					</p>
				);
			}
			// 渲染 diff：按差异分块，每块用 Markdown 渲染，新增绿色、删除红色背景
			return (
				<article className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent p-6">
					{diffChanges.map((change, index) => {
						// 新增/删除块着色，未变化块保持默认背景
						const diffClass = change.added
							? "bg-green-100 dark:bg-green-900/30"
							: change.removed
								? "bg-red-100 dark:bg-red-900/30"
								: "";
						// 删除块用删除线弱化，仅提示历史内容
						const textClass = change.removed ? "text-muted-foreground line-through opacity-70" : "";
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
			);
		}
		if (content) {
			// 普通视图：Markdown 渲染（与编辑窗预览一致）
			return (
				<article className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent p-6">
					<MarkdownView>{content}</MarkdownView>
				</article>
			);
		}
		return (
			<p className="flex min-h-60 items-center justify-center text-muted-foreground text-sm">
				暂无内容
			</p>
		);
	};

	return (
		<TitlePageShell
			title={
				<div className="flex w-full items-center justify-between">
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="icon-sm" aria-label="返回" onClick={() => router.back()}>
							<Icons.chevronLeft className="size-4" />
						</Button>
						<h1 className="font-semibold text-lg">版本历史</h1>
					</div>
					<div className="flex items-center gap-1.5">
						<Button
							variant={viewMode === "diff" ? "secondary" : "outline"}
							size="sm"
							disabled={isLatestSelected}
							onClick={() => setViewMode(viewMode === "diff" ? "content" : "diff")}
						>
							<Icons.compare className="size-4" />
							Diff
						</Button>
						<HelpTooltip content="查看与最新版本的差异" />
					</div>
				</div>
			}
		>
			{/* // @ 左右分栏：左栏随页面滚动，右栏用 fixed 始终钉在视口右侧 */}
			<div className="flex min-h-[calc(100vh-4rem)] items-start">
				{/* 左侧：选中版本的只读内容 + 底部操作栏，随页面滚动；右侧留出 fixed 面板的占位宽度 */}
				<div className="flex min-w-0 flex-1 flex-col pr-[15rem]">
					<div className="flex-1">{renderContent()}</div>

					{/* 底部操作栏：恢复此记录，sticky 钉在视口底部常驻 */}
					<div className="sticky bottom-0 flex justify-end border-t bg-linear-to-t from-background/80 to-background/5 px-6 py-3 backdrop-blur-sm">
						<Button size="sm" disabled={!selectedId || !content} onClick={handleUse}>
							恢复此记录
						</Button>
					</div>
				</div>
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
