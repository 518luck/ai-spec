"use client";

// # Skills 组织过滤器：通用 FilterShell + 「组织」子菜单 + 右侧已选组织标签
// > URL 读写 ?orgs=a,b；组织数据来自广场索引，不可新建

import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";

import { getDiscoverOrganizations } from "@/entities/discover-skill";
import { FilterShell } from "@/features/filter-combobox";
import { useInertialScroll, useScrollProgress } from "@/shared/hooks";
import type { OrganizationListItemVo } from "@/shared/lib/zod/schemas/discover-skill";
import {
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";
import { ScrollMask } from "@/shared/ui/scroll-mask";
import { OrganizationChip } from "./organization-chip";
import { OrganizationCombobox } from "./organization-combobox";

// URL 参数名：逗号分隔的组织 login 列表
const ORGS_PARAM = "orgs";

type OrganizationFilterProps = {
	className?: string;
};

// > 过滤壳 + 组织子菜单 + 右侧已选组织 chips（横向滚动 + ScrollMask）
export function OrganizationFilter({ className }: OrganizationFilterProps): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();

	// 组织全量：URL 模式下用于从 login 反查头像给 chips；SWR key 与 OrganizationCombobox 一致，共享缓存
	const { data } = useSWR(["discover-organizations"], () => getDiscoverOrganizations());
	const allOrgs = useMemo<OrganizationListItemVo[]>(() => data?.data ?? [], [data]);

	// 从 URL 解析已选组织 login
	const selectedNames = useMemo(() => {
		const param = searchParams?.get(ORGS_PARAM) ?? "";
		return param
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}, [searchParams]);

	// 已选 chips：优先用列表数据补全头像；列表未加载时仍展示 login
	const chips = useMemo(() => {
		const byName = new Map(allOrgs.map((org) => [org.authorName, org]));
		return selectedNames.map((name) => {
			const hit = byName.get(name);
			return {
				authorName: name,
				authorAvatarUrl: hit?.authorAvatarUrl ?? null,
			};
		});
	}, [allOrgs, selectedNames]);

	// chips 数量：用于驱动 fade 遮罩重算
	const chipsCount = chips.length;

	// 写入 URL ?orgs=
	const writeOrgs = useCallback(
		(next: string[]) => {
			const params = new URLSearchParams(searchParams?.toString() ?? "");
			if (next.length > 0) params.set(ORGS_PARAM, next.join(","));
			else params.delete(ORGS_PARAM);
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	// 从 chips 移除单个组织
	const handleRemove = useCallback(
		(name: string) => {
			writeOrgs(selectedNames.filter((n) => n !== name));
		},
		[selectedNames, writeOrgs],
	);

	// chips 区横滚容器：滚轮转横向 + 进度驱动 ScrollMask
	const chipsScrollRef = useRef<HTMLDivElement>(null);
	const {
		scrollProgress: chipsProgress,
		scrollable: chipsScrollable,
		updateScrollProgress: updateChipsProgress,
	} = useScrollProgress(chipsScrollRef, { direction: "horizontal" });
	// 横向惯性滚动：wheel 直接绑 handleWheel，箭头点击走 scrollTo
	const { handleWheel: handleChipsWheel, scrollTo: scrollChipsTo } = useInertialScroll(
		chipsScrollRef,
		{ direction: "horizontal" },
	);

	// chips 增删后跨布局帧重算进度
	// biome-ignore lint/correctness/useExhaustiveDependencies: chipsCount 是内容变化信号，body 不直接读
	useEffect(() => {
		const id = requestAnimationFrame(() => {
			requestAnimationFrame(() => updateChipsProgress());
		});
		return () => cancelAnimationFrame(id);
	}, [chipsCount, updateChipsProgress]);

	// 箭头点击：按一屏宽度横向滚动，方向由 ScrollMask 回调给出
	const handleArrowClick = useCallback(
		(side: "start" | "end") => {
			const el = chipsScrollRef.current;
			if (!el) return;
			scrollChipsTo((side === "start" ? -1 : 1) * el.clientWidth);
		},
		[scrollChipsTo],
	);

	return (
		<FilterShell
			className={className}
			menu={
				// 组织子菜单：hover/点击在右侧展开多选面板
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="gap-2">
						<Icons.members className="size-4 text-foreground" />
						组织
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className="p-0">
						<OrganizationCombobox value={selectedNames} onChange={writeOrgs} />
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			}
			trailing={
				chips.length > 0 ? (
					<div className="group relative min-w-0 flex-1">
						<div
							ref={chipsScrollRef}
							onWheel={handleChipsWheel}
							onScroll={updateChipsProgress}
							className="flex items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						>
							{chips.map((org) => (
								<OrganizationChip
									key={org.authorName}
									name={org.authorName}
									avatarUrl={org.authorAvatarUrl}
									removable
									onRemove={() => handleRemove(org.authorName)}
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
