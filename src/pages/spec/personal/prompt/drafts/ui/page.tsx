"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import { FolderCombobox } from "@/features/folder-combobox";
import { SearchInput } from "@/features/search-input";
import { HOTKEYS } from "@/shared/configs/hotkeys.config";
import { useHotkey, useInView, useThumbSmooth } from "@/shared/hooks";
import { client } from "@/shared/lib/orpc/client";
import { draftKeys } from "@/shared/lib/orpc/query-keys";
import type { ListDraftsDto } from "@/shared/lib/zod/schemas/prompt/draft";
import { Button } from "@/shared/ui/button";
import { CenteredLoader } from "@/shared/ui/centered-loader";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { InfiniteListFooter } from "@/shared/ui/infinite-list-footer";
import { Kbd } from "@/shared/ui/kbd";
import { EmptyState } from "@/widgets/empty-state";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { CreateDraftDialog } from "./create-draft-dialog";
import { DraftsGrid } from "./drafts-grid";

// # 个人草稿页：Infinite Query 拉取 drafts 列表，底部哨兵进入视口时自动加载下一页
export function PersonalDraftsPage({ q, filter, folderId }: ListDraftsDto): JSX.Element {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { status } = useSession();
	const [createOpen, setCreateOpen] = useState(false);

	// > kbar「新建草稿」经 ?create=1 落地：URL 带该参数时自动开创建弹窗；用后清 URL 避免刷新重复触发
	useEffect(() => {
		if (searchParams?.get("create") === "1") {
			setCreateOpen(true);
			// 清除 URL 中的 create 参数，保留其余筛选参数
			const params = new URLSearchParams(searchParams.toString());
			params.delete("create");
			router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`);
		}
	}, [searchParams, router, pathname]);

	// > C 键打开创建弹窗：创建弹窗已开时禁用，避免叠开
	useHotkey({
		combo: HOTKEYS.createNew.combo,
		onTrigger: () => setCreateOpen(true),
		enabled: !createOpen,
	});

	// > 列表筛选参数：任一变化自动重置到第一页（queryKey 内嵌即作废）；status!=="authenticated" 时禁用请求
	const listParams = { q, filter, folderId };
	const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
		queryKey: draftKeys.infinite(listParams),
		queryFn: ({ pageParam }) =>
			// pageParam 为 1-based 页码（initialPageParam 给 1），直接传给后端 list procedure
			client.drafts.list({ ...listParams, page: pageParam }),
		initialPageParam: 1,
		// hasMore=true 时返回下一页码（当前页 + 1），false 返回 undefined 停止翻页；pageParam 为当前页码
		getNextPageParam: (lastPage, _allPages, lastPageParam) =>
			lastPage.hasMore ? (lastPageParam ?? 1) + 1 : undefined,
		enabled: status === "authenticated",
	});

	const drafts = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
	const total = data?.pages[0]?.total ?? 0;
	const hasMore = hasNextPage;
	// 已加载页数 > 1 表示翻过页；短列表首页即到底时为 false，配合 hasMore 判断是否渲染底部 footer
	const hasPaged = (data?.pages.length ?? 0) > 1;

	// 底部哨兵进入视口且还有下一页、未在加载中时，自动加载下一页
	const { ref: sentinelRef, inView } = useInView({ threshold: 0 });
	useEffect(() => {
		if (inView && hasMore && !isFetchingNextPage) {
			void fetchNextPage();
		}
	}, [inView, hasMore, isFetchingNextPage, fetchNextPage]);

	// > 滚动条平滑过渡：内容追加新页（drafts.length 增长）时短暂开启，让 thumb 平滑收缩而非瞬变
	const thumbSmooth = useThumbSmooth(drafts.length);

	// 列表主体：首屏 loading / 空状态 / 网格 + 无限滚动底部分三种状态，扁平化避免嵌套三元
	const renderDraftsBody = (): JSX.Element => {
		if (isLoading) {
			return <CenteredLoader />;
		}
		if (total === 0) {
			return <EmptyState icon={Icons.prompt} description="还没有草稿，随手记下你的灵感吧" />;
		}
		return (
			<>
				<DraftsGrid drafts={drafts} />
				<InfiniteListFooter
					hasMore={hasMore}
					hasPaged={hasPaged}
					isValidating={isFetchingNextPage}
					sentinelRef={sentinelRef}
					endText="到底了，没有更多草稿了"
				/>
			</>
		);
	};

	return (
		<ToolbarPageShell
			title="草稿"
			help={<HelpTooltip content="随手记录灵感，可复用到收录库、Agent.md 等位置" />}
			scrollAreaProps={{ thumbSmooth }}
			filter={<FolderCombobox resourceType="promptDraft" />}
			search={
				// // > max-w-80 上限 320px、w-full 跟随父级弹性收缩，避免窄窗口标题栏溢出
				// // > -translate-x-20 纯视觉偏移，让搜索框整体向左挪一点，不改变 flex 布局
				<SearchInput
					className="w-full max-w-80 -translate-x-20"
					filters={["title", "content"]}
					defaultFilter="title"
				/>
			}
			actions={
				status === "authenticated" ? (
					<>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setCreateOpen(true)}
							className="gap-2"
						>
							新建草稿
							<Kbd alignWithText hideOnNarrow>
								{HOTKEYS.createNew.label}
							</Kbd>
						</Button>
						<CreateDraftDialog open={createOpen} onOpenChange={setCreateOpen} />
					</>
				) : undefined
			}
		>
			<PageWidthWrapper fill>{renderDraftsBody()}</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
