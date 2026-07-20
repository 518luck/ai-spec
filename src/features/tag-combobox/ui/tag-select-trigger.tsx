"use client";

// # 标签选择器：已选 chips + 添加标签按钮 + Popover（内嵌纯面板 TagCombobox）
// > 完整的标签选择单元，FilterCombobox、editor-toolbar 等场景直接复用
// > 受控模式：传 value/onChange，由父组件管理选中状态
// > URL 模式：不传 value/onChange，自动读写 ?tagIds=（导航栏筛选用）

import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { getTags } from "@/entities/tag";
import { useInertialScroll, useScrollProgress } from "@/shared/hooks";
import { cn } from "@/shared/lib/utils";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ScrollMask } from "@/shared/ui/scroll-mask";
import { TagChip } from "./tag-chip";
import { TagCombobox } from "./tag-combobox";

// URL 参数名：与 TagCombobox 内部一致，URL 模式下读写已选 tag id 列表
const TAG_IDS_PARAM = "tagIds";

type TagSelectTriggerProps = {
	// 标签归属的资源类型（如 "promptRecord"），透传给内嵌面板
	resourceType: string;
	// 已选标签：传了走受控模式，没传自动从 URL 读 id 反查
	value?: TagOptionVo[];
	// 选中变化回调：传了走受控，没传自动写入 URL
	onChange?: (tags: TagOptionVo[]) => void;
	// 弹层打开状态：传了走受控（外层需要主动触发打开时使用），没传自动管理
	open?: boolean;
	// 弹层打开状态变化回调：与 open 配套
	onOpenChange?: (open: boolean) => void;
	// 触发按钮样式：默认 outline，编辑器标题栏等场景可用 ghost 融入背景
	triggerVariant?: "outline" | "ghost";
	// PopoverContent 对齐方式，默认 start
	align?: "start" | "center" | "end";
	// 无选中标签时是否整体隐藏（默认 false：编辑器等场景未选也要能点 + 添加）
	hideWhenEmpty?: boolean;
	// chips 是否只显示色点：空间紧凑场景（如编辑器标题栏）开启，hover 出 Tooltip 看名称；移除走面板内取消勾选
	iconOnly?: boolean;
	// 外层 className（控制最大宽度等）
	className?: string;
};

// > 标签选择器：chips + + 按钮 + Popover（内嵌 TagCombobox 面板）
export function TagSelectTrigger({
	resourceType,
	value: controlledValue,
	onChange: controlledOnChange,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	triggerVariant = "outline",
	align = "start",
	hideWhenEmpty = false,
	iconOnly = false,
	className,
}: TagSelectTriggerProps): JSX.Element | null {
	const router = useRouter();
	const searchParams = useSearchParams();

	// 弹层 open 状态：受控时透传，非受控时自管
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;
	const setOpen = useCallback(
		(next: boolean) => {
			if (controlledOpen !== undefined) {
				controlledOnOpenChange?.(next);
			} else {
				setInternalOpen(next);
			}
		},
		[controlledOpen, controlledOnOpenChange],
	);

	// 全量标签：URL 模式下用于从 id 反查 name/color 给 chips；SWR key 与 TagCombobox 一致，共享缓存
	const { data: rawTags } = useSWR(["tags", resourceType], () => getTags(resourceType));
	const allTags = useMemo<TagOptionVo[]>(() => rawTags ?? [], [rawTags]);

	// URL 模式下读出已选 tagIds（受控模式不用）
	const urlTagIds = useMemo(() => {
		if (controlledValue !== undefined) return [];
		const param = searchParams?.get(TAG_IDS_PARAM) ?? "";
		return param
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}, [controlledValue, searchParams]);

	// 实际生效的已选值：受控模式直接用 controlledValue；URL 模式从 allTags 反查
	const chips = useMemo<TagOptionVo[]>(() => {
		if (controlledValue !== undefined) return controlledValue;
		const idSet = new Set(urlTagIds);
		return allTags.filter((t) => idSet.has(t.id));
	}, [controlledValue, urlTagIds, allTags]);

	// chips 数量：用于驱动 fade 遮罩重算，单独抽出来作为 effect 依赖
	const chipsCount = chips.length;

	// 移除某个已选 tag：受控透传回调，URL 模式重写参数
	const handleRemove = useCallback(
		(tagId: string) => {
			if (controlledOnChange && controlledValue !== undefined) {
				controlledOnChange(controlledValue.filter((t) => t.id !== tagId));
				return;
			}
			const next = urlTagIds.filter((id) => id !== tagId);
			const params = new URLSearchParams(searchParams?.toString() ?? "");
			if (next.length > 0) params.set(TAG_IDS_PARAM, next.join(","));
			else params.delete(TAG_IDS_PARAM);
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[controlledOnChange, controlledValue, urlTagIds, searchParams, router],
	);

	// chips 区横滚容器：滚轮转横向 + 进度驱动 ScrollMask
	const chipsScrollRef = useRef<HTMLDivElement>(null);
	const { scrollProgress: chipsProgress, updateScrollProgress: updateChipsProgress } =
		useScrollProgress(chipsScrollRef, { direction: "horizontal" });
	// 横向惯性滚动：wheel 直接绑 handleWheel，箭头点击走 scrollTo，都走 rAF + lerp 缓动
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

	// 开启 hideWhenEmpty 且无选中标签时不渲染：放在所有 hooks 之后，保持 hooks 调用顺序稳定
	if (hideWhenEmpty && chips.length === 0) return null;

	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			{/* // 添加标签按钮：打开标签面板，搜索/勾选/新建；固定在最左侧，避免选中 chips 后整体布局推动 */}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button
							variant={triggerVariant}
							size="icon-sm"
							className="size-7 shrink-0 text-muted-foreground"
							aria-label="选择标签"
						/>
					}
				>
					<Icons.tagAdd className="size-4" />
				</PopoverTrigger>
				<PopoverContent className="w-44 p-0" align={align}>
					<TagCombobox
						resourceType={resourceType}
						value={controlledValue}
						onChange={controlledOnChange}
					/>
				</PopoverContent>
			</Popover>
			{/* // 已选 chips 区：横向排列，溢出滚动；未选时不占位；左右两侧用 ScrollMask 弥散遮罩代替硬截断 */}
			{chips.length > 0 && (
				<div className="group relative min-w-0 flex-1">
					<div
						ref={chipsScrollRef}
						onWheel={handleChipsWheel}
						onScroll={updateChipsProgress}
						className="flex items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					>
						{chips.map((tag) => (
							<TagChip
								key={tag.id}
								name={tag.name}
								color={tag.color}
								iconOnly={iconOnly}
								{...(!iconOnly && { removable: true, onRemove: () => handleRemove(tag.id) })}
							/>
						))}
					</div>
					<ScrollMask
						scrollProgress={chipsProgress}
						direction="horizontal"
						sides="both"
						onArrowClick={handleArrowClick}
					/>
				</div>
			)}
		</div>
	);
}
