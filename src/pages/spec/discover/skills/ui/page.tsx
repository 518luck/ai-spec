"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSession } from "next-auth/react";
import { type JSX, useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { getDiscoverSkills } from "@/entities/discover-skill";
import { SearchInput } from "@/features/search-input";
import { useInView, useThumbSmooth } from "@/shared/hooks";
import { setCookie } from "@/shared/lib/cookie/client-cookie";
import { COOKIE_DEFAULTS, DISCOVER_SKILL_DESC_LANG_COOKIE } from "@/shared/lib/cookie/cookies";
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
import type { SkillDescLang } from "../lib/desc-lang";
import { SkillFilter } from "./filter";
import { ImportDialog } from "./import-dialog";
import { SkillLangToggle } from "./lang-toggle";
import { SkillCard } from "./skill-card";

type DiscoverSkillsPageProps = ListDiscoverSkillsDto & {
	// SSR 从 cookie 读出的描述语言，避免首屏语言闪烁
	initialDescLang?: SkillDescLang;
};

// # Skills 广场页：按 star 递减列表 + 组织 / 热度筛选 + 搜索 + 无限滚动
export function DiscoverSkillsPage({
	q,
	filter,
	orgs,
	minStars,
	initialDescLang = "zh",
}: DiscoverSkillsPageProps): JSX.Element {
	const { status } = useSession();
	const [importOpen, setImportOpen] = useState(false);
	// 本会话已反馈的 skillId（避免连点；不跨刷新持久化）
	const [reportedIds, setReportedIds] = useState<ReadonlySet<string>>(() => new Set());
	// 卡片描述语言：cookie 初值 + 切换时回写
	const [descLang, setDescLang] = useState<SkillDescLang>(initialDescLang);

	// 反馈成功后记入本会话集合
	const handleSkillReported = (skillId: string): void => {
		setReportedIds((prev) => {
			const next = new Set(prev);
			next.add(skillId);
			return next;
		});
	};

	// 切换语言并写入 cookie（与主题/侧边栏同一套 client-cookie）
	const handleDescLangChange = (next: SkillDescLang): void => {
		setDescLang(next);
		setCookie(DISCOVER_SKILL_DESC_LANG_COOKIE, next, COOKIE_DEFAULTS);
	};

	// SWR Infinite key：q/filter/orgs/minStars 变化自动重置到第一页
	const getKey = (_pageIndex: number, previousPageData: DiscoverSkillListVo | null) => {
		if (status !== "authenticated") return null;
		if (previousPageData && !previousPageData.hasMore) return null;
		const offset = previousPageData?.nextOffset ?? 0;
		return ["discover-skills", q, filter, orgs, minStars, offset] as const;
	};

	const { data, isLoading, isValidating, setSize, mutate } = useSWRInfinite(
		getKey,
		async ([, q, filter, orgs, minStars, offset]) =>
			getDiscoverSkills({ q, filter, orgs, minStars, offset }),
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
{/* // 大屏约 4 列，卡片比收录略大；高度仍由 ContentCard aspect-4/3 统一 */}
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-4 2xl:gap-6">
						{skills.map((skill) => (
							<SkillCard
								key={skill.id}
								skill={skill}
								lang={descLang}
								canReport={status === "authenticated"}
								reported={reportedIds.has(skill.id)}
								onReported={handleSkillReported}
							/>
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
			backToTop
			actions={
				<>
					{/* 中/英描述切换：只改卡片文案，偏好写入 cookie */}
					<SkillLangToggle value={descLang} onChange={handleDescLangChange} />
					{status === "authenticated" ? (
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
					) : null}
				</>
			}
		>
			<PageWidthWrapper fill>
				{/* // @ 工具条带：左侧组织 / 热度过滤，中部结果数，右侧搜索 */}
				<div className="mb-6 flex items-center gap-3">
					<SkillFilter className="min-w-0 flex-1" />
					{/* 结果数：加载中卸下时淡出，出现时淡入上浮 */}
					<AnimatePresence initial={false}>
						{!isLoading ? (
							<motion.span
								key="skills-total"
								className="shrink-0 text-muted-foreground text-xs tabular-nums"
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.18, ease: "easeOut" }}
							>
								{total.toLocaleString("zh-CN")}
							</motion.span>
						) : null}
					</AnimatePresence>
					{/* // 搜索：标题=skill 名，描述=中英文 description；可单选或同时搜 */}
					<SearchInput
						className="max-w-80 shrink-0"
						filters={["title", "description"]}
						defaultFilter="title"
					/>
				</div>
				{renderSkillsBody()}
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
