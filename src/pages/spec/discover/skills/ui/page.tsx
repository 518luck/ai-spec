"use client";

import { useSession } from "next-auth/react";
import { type JSX, useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { getDiscoverSkills } from "@/entities/discover-skill";
import { SearchInput } from "@/features/search-input";
import { useInView } from "@/shared/hooks";
import type {
	DiscoverSkillListVo,
	ListDiscoverSkillsDto,
} from "@/shared/lib/zod/schemas/discover-skill";
import { Button } from "@/shared/ui/button";
import { CenteredLoader } from "@/shared/ui/centered-loader";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { InfiniteListFooter } from "@/shared/ui/infinite-list-footer";
import { EmptyState } from "@/widgets/empty-state";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { ImportDialog } from "./import-dialog";
import { SkillCard } from "./skill-card";

// # Skills 广场页：SWR Infinite 拉取 GET /api/discover/skills，按 star 倒序的卡片网格 + 搜索 + 无限滚动
export function DiscoverSkillsPage({ q }: ListDiscoverSkillsDto): JSX.Element {
	const { status } = useSession();
	const [importOpen, setImportOpen] = useState(false);

	// SWR Infinite key：q 变化自动重置到第一页；上一页无更多数据时返回 null 停止加载
	const getKey = (_pageIndex: number, previousPageData: DiscoverSkillListVo | null) => {
		if (status !== "authenticated") return null;
		if (previousPageData && !previousPageData.hasMore) return null;
		const offset = previousPageData?.nextOffset ?? 0;
		return ["discover-skills", q, offset] as const;
	};

	const { data, isLoading, isValidating, setSize, mutate } = useSWRInfinite(
		getKey,
		async ([, q, offset]) => getDiscoverSkills({ q, offset }),
	);

	const skills = useMemo(() => data?.flatMap((page) => page.data) ?? [], [data]);
	const total = data?.[0]?.total ?? 0;
	const hasMore = data?.[data.length - 1]?.hasMore ?? false;
	const hasPaged = (data?.length ?? 0) > 1;

	// 底部哨兵进入视口且还有下一页、未在加载中时，自动加载下一页
	const { ref: sentinelRef, inView } = useInView({ threshold: 0 });
	useEffect(() => {
		if (inView && hasMore && !isValidating) {
			void setSize((s) => s + 1);
		}
	}, [inView, hasMore, isValidating, setSize]);

	// 列表主体：首屏 loading / 空状态 / 网格 + 无限滚动底部分三种状态，扁平化避免嵌套三元
	const renderSkillsBody = (): JSX.Element => {
		if (isLoading) {
			return <CenteredLoader />;
		}
		if (total === 0) {
			return (
				<EmptyState
					icon={Icons.skills}
					description="广场还空着，粘贴一个 GitHub 仓库链接，把好用的 skills 收进来吧"
				/>
			);
		}
		return (
			<>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 xl:gap-4">
					{skills.map((skill) => (
						<SkillCard key={skill.id} skill={skill} />
					))}
				</div>
				<InfiniteListFooter
					hasMore={hasMore}
					hasPaged={hasPaged}
					isValidating={isValidating}
					sentinelRef={sentinelRef}
					endText="到底了，没有更多 skills 了"
				/>
			</>
		);
	};

	return (
		<ToolbarPageShell
			title="Skills"
			help={<HelpTooltip content="来自 GitHub 开源社区的 Agent Skills，逛一逛，看中就收" />}
			actions={
				status === "authenticated" ? (
					<>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setImportOpen(true)}
							className="gap-2"
						>
							<Icons.github className="size-4" />
							导入 Skills
						</Button>
						<ImportDialog
							open={importOpen}
							onOpenChange={setImportOpen}
							onImported={() => mutate()}
						/>
					</>
				) : undefined
			}
		>
			<PageWidthWrapper fill>
				{/* // @ 工具条带：搜索框贴右 */}
				<div className="mb-6 flex items-center justify-end">
					<SearchInput className="max-w-80" />
				</div>
				{renderSkillsBody()}
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
