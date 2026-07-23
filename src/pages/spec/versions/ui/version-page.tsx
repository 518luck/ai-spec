"use client";

// # 通用版本页：纯 UI + 交互，数据源和行为通过 props 注入，不耦合任何具体资源 API

import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { type JSX, useCallback, useState } from "react";
import useSWR from "swr";
import { toast } from "@/features/toast";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";

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
	// 回滚到指定版本（立即落库）
	rollback: (versionId: string) => Promise<void>;
	// 使用此版本：返回跳转目标 URL（带上 versionId 等），由通用页执行 router.push
	buildUseUrl: (versionId: string) => string;
}

// > 格式化时间为「MM-DD HH:mm」
const formatTime = (dateString: string): string => dayjs(dateString).format("MM-DD HH:mm");

export function VersionPage({ handlers }: { handlers: VersionPageHandlers }): JSX.Element {
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	// 回滚中的版本 id（禁用按钮防重复点击）
	const [rollingBackId, setRollingBackId] = useState<string | null>(null);

	// > 版本列表 —— 客户端 SWR 拉取
	const {
		data: versions,
		isLoading: listLoading,
		mutate: mutateVersions,
	} = useSWR("versions", handlers.fetchVersions, {
		// 首次加载完自动选中最新版
		onSuccess: (data) => {
			if (!selectedId && data.length > 0) {
				setSelectedId(data[0].id);
			}
		},
	});

	// > 选中版本的完整内容（客户端异步拉取）
	const { data: content, isLoading: contentLoading } = useSWR(
		selectedId ? ["version-content", selectedId] : null,
		() => (selectedId ? handlers.fetchVersionContent(selectedId) : Promise.resolve("")),
		{ revalidateOnFocus: false },
	);

	// > 使用此版本：跳转到 handler 给出的 URL
	const handleUse = useCallback(() => {
		if (!selectedId) return;
		router.push(handlers.buildUseUrl(selectedId));
	}, [router, selectedId, handlers]);

	// > 回滚：调注入的 rollback + 刷新列表
	const handleRollback = useCallback(
		async (versionId: string) => {
			try {
				setRollingBackId(versionId);
				await handlers.rollback(versionId);
				toast.success("回滚成功");
				await mutateVersions();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "回滚失败");
			} finally {
				setRollingBackId(null);
			}
		},
		[handlers, mutateVersions],
	);

	return (
		<div className="flex h-full min-h-0 flex-col">
			{/* // # 顶栏：返回 + 标题 */}
			<div className="flex h-16 shrink-0 items-center gap-3 border-b px-6">
				<Button variant="ghost" size="icon-sm" aria-label="返回" onClick={() => router.back()}>
					<Icons.chevronLeft className="size-4" />
				</Button>
				<h1 className="font-semibold text-lg">版本历史</h1>
			</div>

			{/* // @ 左右分栏：左侧版本内容，右侧时间列表 */}
			<div className="flex min-h-0 flex-1">
				{/* 左侧：选中版本的只读内容 */}
				<div className="flex min-w-0 flex-1 flex-col border-r">
					{contentLoading ? (
						<div className="flex flex-1 items-center justify-center">
							<Spinner className="size-5" />
						</div>
					) : content ? (
						<ScrollArea className="min-h-0 flex-1">
							<pre className="whitespace-pre-wrap break-words p-6 font-mono text-sm leading-relaxed">
								{content}
							</pre>
						</ScrollArea>
					) : (
						<p className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
							暂无内容
						</p>
					)}
					{/* 底部操作栏：使用此版本 + 回滚 */}
					<div className="flex justify-end gap-2 border-t px-6 py-3">
						<Button
							variant="outline"
							size="sm"
							disabled={!selectedId || rollingBackId === selectedId}
							onClick={() => selectedId && handleRollback(selectedId)}
						>
							{rollingBackId === selectedId ? "回滚中..." : "回滚"}
						</Button>
						<Button size="sm" disabled={!selectedId || !content} onClick={handleUse}>
							使用此版本
						</Button>
					</div>
				</div>

				{/* 右侧：版本时间列表 */}
				<div className="flex w-48 shrink-0 flex-col">
					<ScrollArea className="min-h-0 flex-1">
						<div className="space-y-1 p-2">
							{listLoading ? (
								Array.from({ length: 5 }).map((_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: 静态骨架屏列表
									<Skeleton key={i} className="h-9 w-full" />
								))
							) : !versions || versions.length === 0 ? (
								<p className="px-2 py-4 text-center text-muted-foreground text-xs">暂无版本</p>
							) : (
								versions.map((version) => (
									<button
										key={version.id}
										type="button"
										onClick={() => setSelectedId(version.id)}
										className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
											selectedId === version.id
												? "bg-accent text-accent-foreground"
												: "hover:bg-accent/50"
										}`}
									>
										{formatTime(version.createdAt)}
									</button>
								))
							)}
						</div>
					</ScrollArea>
				</div>
			</div>
		</div>
	);
}
