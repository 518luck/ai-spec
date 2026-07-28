"use client";

// # 组织选择面板：搜索 + 勾选的纯内容组件，不含 Popover/chips/触发器
// > 由外层 SkillFilter 包 DropdownMenu 和 chips 展示
// > 数据来自 GET /api/discover/skills/organizations

import { type JSX, type KeyboardEvent, useCallback, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";

import { getDiscoverOrganizations } from "@/entities/discover-skill";
import { CommandScrollMask } from "@/features/command-scroll-mask";
import { useScrollProgress } from "@/shared/hooks";
import { cn } from "@/shared/lib/utils";
import type { OrganizationListItemVo } from "@/shared/lib/zod/schemas/discover-skill";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandList,
} from "@/shared/ui/command";
import { Skeleton } from "@/shared/ui/skeleton";
import { OrganizationOptionItem } from "./organization-option-item";

// 阻止 keydown 冒泡到外层 DropdownMenu：base-ui Menu 的 typeahead 会吞掉所有字符按键，导致嵌入的搜索框收不到输入
const stopMenuTypeahead = (e: KeyboardEvent): void => {
	e.stopPropagation();
};

type OrganizationComboboxProps = {
	// 已选组织 login 列表
	value: string[];
	// 选中变化（完整 login 列表）
	onChange: (orgs: string[]) => void;
	// 挂载完成回调：外层打开后可用其触发额外逻辑
	onMount?: () => void;
	// 外层 className：默认 w-56，可覆盖宽度
	className?: string;
};

// > 组织多选面板：搜索 + 勾选，纯内容组件；选中不关弹层可连续选
export function OrganizationCombobox({
	value,
	onChange,
	onMount,
	className,
}: OrganizationComboboxProps): JSX.Element {
	const {
		data,
		isLoading,
		mutate: refetch,
	} = useSWR(["discover-organizations"], () => getDiscoverOrganizations());
	const allOrgs = useMemo<OrganizationListItemVo[]>(() => data?.data ?? [], [data]);
	const selectedNames = useMemo(() => new Set(value), [value]);

	// 列表滚动容器 ref：驱动 ScrollMask 渐变
	const listRef = useRef<HTMLDivElement>(null);
	const { scrollProgress, scrollable, updateScrollProgress } = useScrollProgress(listRef);

	// 挂载时刷新一次，保证组织统计新鲜（外层 SubMenu 每次展开会重新挂载本面板）
	useEffect(() => {
		void refetch();
		onMount?.();
	}, [refetch, onMount]);

	// > 重算滚动进度：数据到达时容器可见高度被 max-h 钉死，需双 rAF 跨过布局后再测量
	// biome-ignore lint/correctness/useExhaustiveDependencies: allOrgs 作为触发信号，effect body 不读它但需响应其变化
	useEffect(() => {
		const id = requestAnimationFrame(() => {
			requestAnimationFrame(() => updateScrollProgress());
		});
		return () => cancelAnimationFrame(id);
	}, [allOrgs, updateScrollProgress]);

	// 切换某个组织的选中态：已选则移除，未选则追加
	const toggleOrg = useCallback(
		(authorName: string) => {
			if (selectedNames.has(authorName)) {
				onChange(value.filter((name) => name !== authorName));
				return;
			}
			onChange([...value, authorName]);
		},
		[onChange, selectedNames, value],
	);

	return (
		<Command className={cn("w-56", className)}>
			{/* // > 捕获阶段拦截 keydown：阻止事件冒泡到外层 DropdownMenu 的 typeahead，否则菜单会把字符按键当作快速跳转吞掉，input 收不到输入 */}
			<div onKeyDownCapture={stopMenuTypeahead}>
				<CommandInput placeholder="搜索组织…" />
			</div>
			<div className="relative">
				{/* // scrollbar-thin：macOS 风格透明滚动条（hover 淡入），覆盖 CommandList 默认无效的 no-scrollbar */}
				<CommandList
					ref={listRef}
					onScroll={updateScrollProgress}
					className="scrollbar-thin max-h-64"
				>
					<CommandEmpty>
						<span className="text-muted-foreground">没有匹配的组织</span>
					</CommandEmpty>

					{isLoading ? (
						<CommandGroup>
							{["a", "b", "c"].map((k) => (
								<div key={k} className="flex items-center gap-2 px-2 py-1.5">
									<Skeleton className="size-5 shrink-0 rounded-full" />
									<Skeleton className="h-4 flex-1" />
									<Skeleton className="h-3 w-6" />
								</div>
							))}
						</CommandGroup>
					) : allOrgs.length === 0 ? (
						<CommandGroup>
							<div className="px-2 py-1.5 text-muted-foreground text-sm">还没有可筛选的组织</div>
						</CommandGroup>
					) : (
						<CommandGroup>
							{allOrgs.map((org) => (
								<OrganizationOptionItem
									key={org.authorName}
									org={org}
									selected={selectedNames.has(org.authorName)}
									onSelect={() => toggleOrg(org.authorName)}
								/>
							))}
						</CommandGroup>
					)}
				</CommandList>
				{/* // 底部弥散遮罩：仅列表可滚时显示；色取 popover 与弹层一致 */}
				<CommandScrollMask
					scrollProgress={scrollProgress}
					enabled={scrollable}
					onSearchChange={updateScrollProgress}
				/>
			</div>
		</Command>
	);
}
