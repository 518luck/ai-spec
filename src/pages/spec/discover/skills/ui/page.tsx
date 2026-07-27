"use client";

import { useSession } from "next-auth/react";
import { type JSX, useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { getDiscoverSkills } from "@/entities/discover-skill";
import { SearchInput } from "@/features/search-input";
import { useInView, useThumbSmooth } from "@/shared/hooks";
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
import { SkillFilter } from "./filter";
import { ImportDialog } from "./import-dialog";
import { SkillCard } from "./skill-card";

// # Skills 广场页：按 star 递减列表 + 组织 / 热度筛选 + 搜索 + 无限滚动
export function DiscoverSkillsPage({ q, orgs, minStars }: ListDiscoverSkillsDto): JSX.Element {
	const { status } = useSession();
	const [importOpen, setImportOpen] = useState(false);

	// SWR Infinite key：q/orgs/minStars 变化自动重置到第一页
	const getKey = (_pageIndex: number, previousPageData: DiscoverSkillListVo | null) => {
		if (status !== "authenticated") return null;
		if (previousPageData && !previousPageData.hasMore) return null;
		const offset = previousPageData?.nextOffset ?? 0;
		return ["discover-skills", q, orgs, minStars, offset] as const;
	};

	const { data, isLoading, isValidating, setSize, mutate } = useSWRInfinite(
		getKey,
		async ([, q, orgs, minStars, offset]) => getDiscoverSkills({ q, orgs, minStars, offset }),
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

	// > 滚动条平滑过渡：内容追加新页时短暂开启
	const thumbSmooth = useThumbSmooth(skills.length);

	const hasFilters = Boolean(orgs || q || (minStars !== undefined && minStars > 0));

	const renderSkillsBody = (): JSX.Element => {
		if (isLoading) {
			return <CenteredLoader />;
		}
		if (total === 0) {
			return (
				<EmptyState
					icon={Icons.skills}
					description={
						hasFilters
							? "没有符合当前筛选条件的 skills"
							: "广场还空着，粘贴一个 GitHub 仓库链接，把好用的 skills 收进来吧"
					}
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
			scrollAreaProps={{ thumbSmooth }}
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
				{/* // @ 工具条带：左侧组织 / 热度过滤，右侧搜索 */}
				<div className="mb-6 flex items-center gap-3">
					<SkillFilter className="min-w-0 flex-1" />
					<SearchInput className="max-w-80 shrink-0" />
				</div>
				{renderSkillsBody()}
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
