"use client";

// # Skills 过滤器：PanelTrigger + 组织 + 热度（star 门槛）+ 右侧已选条件
// > URL：?orgs=a,b & minStars=2000；列表始终按 star 数量递减

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useEffect, useMemo, useRef } from "react";

import { PanelTrigger } from "@/features/panel-trigger";
import { useInertialScroll, useScrollProgress } from "@/shared/hooks";
import { client } from "@/shared/lib/orpc/client";
import { discoverOrganizationKeys } from "@/shared/lib/orpc/query-keys";
import type { OrganizationListItemVo } from "@/shared/lib/zod/schemas/discover-skill";
import {
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/shared/ui/dropdown-menu";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { ScrollMask } from "@/shared/ui/scroll-mask";
import { HeatMenu } from "./heat-menu";
import { formatHeatLabel } from "./heat-thresholds";
import { OrganizationChip } from "./organization-chip";
import { OrganizationCombobox } from "./organization-combobox";

// URL 参数名
const ORGS_PARAM = "orgs";
const MIN_STARS_PARAM = "minStars";

type SkillFilterProps = {
	className?: string;
};

// > 过滤壳 + 组织 / 热度菜单 + 右侧 chips
export function SkillFilter({ className }: SkillFilterProps): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();

	// 组织全量：反查 chips 头像；与 OrganizationCombobox 共享同一 queryKey 缓存（TanStack 自动去重）
	const { data } = useQuery({
		queryKey: discoverOrganizationKeys.list(),
		queryFn: () => client.discoverOrganizations.list(),
	});
	const allOrgs = useMemo<OrganizationListItemVo[]>(() => data?.data ?? [], [data]);

	// 已选组织 login
	const selectedNames = useMemo(() => {
		const param = searchParams?.get(ORGS_PARAM) ?? "";
		return param
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}, [searchParams]);

	// 热度门槛（非法值视为未选）
	const minStars = useMemo(() => {
		const raw = searchParams?.get(MIN_STARS_PARAM);
		if (!raw) return undefined;
		const n = Number(raw);
		return Number.isInteger(n) && n > 0 ? n : undefined;
	}, [searchParams]);

	// 组织 chips
	const orgChips = useMemo(() => {
		const byName = new Map(allOrgs.map((org) => [org.authorName, org]));
		return selectedNames.map((name) => {
			const hit = byName.get(name);
			return {
				authorName: name,
				authorAvatarUrl: hit?.authorAvatarUrl ?? null,
			};
		});
	}, [allOrgs, selectedNames]);

	const chipsCount = orgChips.length + (minStars !== undefined ? 1 : 0);

	const patchParams = useCallback(
		(mutate: (params: URLSearchParams) => void) => {
			const params = new URLSearchParams(searchParams?.toString() ?? "");
			mutate(params);
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	const writeOrgs = useCallback(
		(next: string[]) => {
			patchParams((params) => {
				if (next.length > 0) params.set(ORGS_PARAM, next.join(","));
				else params.delete(ORGS_PARAM);
			});
		},
		[patchParams],
	);

	// 切换热度：点已选项清除，点其他项写入 minStars
	const handleToggleHeat = useCallback(
		(value: number) => {
			patchParams((params) => {
				if (minStars === value) params.delete(MIN_STARS_PARAM);
				else params.set(MIN_STARS_PARAM, String(value));
			});
		},
		[minStars, patchParams],
	);

	const handleClearHeat = useCallback(() => {
		patchParams((params) => {
			params.delete(MIN_STARS_PARAM);
		});
	}, [patchParams]);

	const handleRemoveOrg = useCallback(
		(name: string) => {
			writeOrgs(selectedNames.filter((n) => n !== name));
		},
		[selectedNames, writeOrgs],
	);

	const chipsScrollRef = useRef<HTMLDivElement>(null);
	const {
		scrollProgress: chipsProgress,
		scrollable: chipsScrollable,
		updateScrollProgress: updateChipsProgress,
	} = useScrollProgress(chipsScrollRef, { direction: "horizontal" });
	const { handleWheel: handleChipsWheel, scrollTo: scrollChipsTo } = useInertialScroll(
		chipsScrollRef,
		// chips 条件挂载：有选中项时再绑原生 wheel，避免 ref 为空时漏绑
		{ direction: "horizontal", enabled: chipsCount > 0 },
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: chipsCount 是内容变化信号
	useEffect(() => {
		const id = requestAnimationFrame(() => {
			requestAnimationFrame(() => updateChipsProgress());
		});
		return () => cancelAnimationFrame(id);
	}, [chipsCount, updateChipsProgress]);

	const handleArrowClick = useCallback(
		(side: "start" | "end") => {
			const el = chipsScrollRef.current;
			if (!el) return;
			scrollChipsTo((side === "start" ? -1 : 1) * el.clientWidth);
		},
		[scrollChipsTo],
	);

	return (
		<PanelTrigger
			className={className}
			menu={
				<>
					{/* // 组织子菜单 */}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2">
							<Icons.members className="size-4 text-foreground" />
							组织
						</DropdownMenuSubTrigger>
						{/* // overflow-hidden：盖掉 SubContent 默认 overflow-y-auto，滚动只发生在 CommandList，底部弥散遮罩才能生效 */}
						<DropdownMenuSubContent className="overflow-hidden p-0">
							<OrganizationCombobox value={selectedNames} onChange={writeOrgs} />
						</DropdownMenuSubContent>
					</DropdownMenuSub>

					{/* // 热度：star 来自源仓库，档位 500 / 2k / 5k / 10k，单选；列表仍按 star 递减 */}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2">
							<Icons.trending className="size-4 text-foreground" />
							热度
							{/* 阻止点帮助时误触开合子菜单（仅 pointerdown，避免静态节点绑 click 的 a11y 告警） */}
							<span className="ml-auto inline-flex" onPointerDown={(e) => e.stopPropagation()}>
								<HelpTooltip
									alignWithText
									content="热度按来源 GitHub 仓库的 Star 数计算，不是单个 Skill 的独立热度；同一仓库下的多个 Skill 会共用该仓库的 Star。"
								/>
							</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="min-w-32 p-1">
							<HeatMenu value={minStars} onSelect={handleToggleHeat} />
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</>
			}
			trailing={
				chipsCount > 0 ? (
					// 限制 chips 带最大宽度，多选时横向滚动，不占满整行
					<div className="group relative min-w-0 max-w-56 flex-1 sm:max-w-142">
						<div
							ref={chipsScrollRef}
							onWheel={handleChipsWheel}
							onScroll={updateChipsProgress}
							className="flex items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						>
							{minStars !== undefined && (
								<span className="inline-flex h-6 shrink-0 select-none items-center gap-1 rounded-full bg-secondary px-2 font-medium text-secondary-foreground text-xs">
									<Icons.trending className="size-3" />
									<span className="tabular-nums">{formatHeatLabel(minStars)}</span>
									<button
										type="button"
										className="ml-0.5 flex shrink-0 items-center rounded-full hover:bg-foreground/10"
										onClick={handleClearHeat}
										aria-label="清除热度筛选"
									>
										<Icons.x className="size-3" />
									</button>
								</span>
							)}
							{orgChips.map((org) => (
								<OrganizationChip
									key={org.authorName}
									name={org.authorName}
									avatarUrl={org.authorAvatarUrl}
									removable
									onRemove={() => handleRemoveOrg(org.authorName)}
								/>
							))}
						</div>
						<ScrollMask
							scrollProgress={chipsProgress}
							enabled={chipsScrollable}
							direction="horizontal"
							sides="both"
							onArrowClick={handleArrowClick}
						/>
					</div>
				) : null
			}
		/>
	);
}
