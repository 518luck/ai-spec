"use client";

// # 规约表格列定义：对齐 shadcn Data Table 的 ColumnDef 写法
// > 选择 / 名称 / 文件夹 / 标签 / 预览 / 更新时间 / 操作；名称与文件夹截断时 hover 出全文

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import Link from "next/link";
import { type JSX, type RefObject, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TagChip } from "@/features/tag-combobox";
import { useResizeObserver } from "@/shared/hooks";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { Checkbox } from "@/shared/ui/checkbox";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { TruncatedTooltip } from "@/shared/ui/truncated-tooltip";
import { TableActions } from "./table-actions";

// 规约列表列：选择列 + 业务列 + 行操作
export const columns: ColumnDef<RuleListItemVo>[] = [
	{
		id: "select",
		size: 40,
		enableSorting: false,
		enableHiding: false,
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="全选当前页"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label={`选择 ${row.original.name}`}
			/>
		),
	},
	{
		accessorKey: "name",
		header: "名称",
		// 名称列不可隐藏：表格至少需要一个可识别列
		enableHiding: false,
		// 收窄名称列，超长靠 TruncatedTooltip 看全文；点名称进详情（预览态）
		size: 160,
		cell: ({ row }) => (
			<Link
				href={`/spec/personal/rules/${row.original.id}`}
				className="block min-w-0 font-medium text-foreground hover:text-primary hover:underline"
			>
				<TruncatedTooltip text={String(row.getValue("name") ?? "")} />
			</Link>
		),
	},
	{
		id: "folder",
		accessorKey: "folderName",
		header: "文件夹",
		// 文件夹列更窄，图标 + 截断名
		size: 128,
		cell: ({ row }) => {
			const folderName = row.original.folderName || "未分类";
			return (
				<span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
					<Icons.folderClosed className="size-4 shrink-0" />
					<TruncatedTooltip text={folderName} />
				</span>
			);
		},
	},
	{
		id: "tags",
		header: "标签",
		// 标签列只读展示：前 3 个 chip，超出收成「+N」hover 看全部
		size: 160,
		enableSorting: false,
		cell: ({ row }) => <RuleTagsCell tags={row.original.tags} />,
	},
	{
		accessorKey: "preview",
		header: "预览",
		// 预览只截断，不挂 tooltip（后续由后端限长）；固定宽度，隐藏其他列时不撑宽
		size: 240,
		cell: ({ row }) => (
			<span className="block truncate text-muted-foreground">{row.getValue("preview")}</span>
		),
	},
	{
		id: "updatedAt",
		header: "更新时间",
		// 相对时间：近期「刚刚/X分钟前/昨天/X天前」，超 7 天退化 MM-DD；纯展示不挂 tooltip
		size: 104,
		enableSorting: false,
		cell: ({ row }) => (
			<span className="whitespace-nowrap text-muted-foreground">
				{formatRelativeTime(row.original.updatedAt)}
			</span>
		),
	},
	{
		id: "actions",
		size: 64,
		enableHiding: false,
		cell: ({ row }) => <TableActions rule={row.original} />,
	},
];

// > 可隐藏列清单（用于列选择 UI 渲染）：select/name/actions 标了 enableHiding:false，不在此列
export const TOGGLEABLE_COLUMNS = [
	{ id: "folder", label: "文件夹" },
	{ id: "tags", label: "标签" },
	{ id: "preview", label: "预览" },
	{ id: "updatedAt", label: "更新时间" },
] as const;

// > 默认列可见性：精简默认 3 列（名称+标签+更新时间），文件夹和预览默认隐藏
export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	name: true,
	tags: true,
	updatedAt: true,
	folder: false,
	preview: false,
};

// localStorage key：持久化用户列选择
export const COLUMN_VISIBILITY_STORAGE_KEY = "rule-table-columns";

// chip 间距（Tailwind gap-1 = 4px），贪心计算时累加
const CHIP_GAP = 4;
// +N 占位宽度预估（px-2 + 两位数字 ≈ 40px）+ 一个 gap，始终预留避免闪烁
const PLUS_N_RESERVED_WIDTH = 44;

// > 按列宽动态折叠的标签列表：测量每个 chip 宽度，贪心放下能容纳的，超出收成 +N
const OverflowTagList = ({ tags }: { tags: RuleListItemVo["tags"] }): JSX.Element => {
	// 容器 ref：同时用于观测列宽变化
	const containerRef = useRef<HTMLDivElement>(null);
	const entry = useResizeObserver(containerRef as RefObject<Element | null>);
	const containerWidth = entry?.contentRect.width ?? 0;

	// 测量层 ref 数组：每个包裹 span 对应一个 chip，读其 offsetWidth
	const measureRefs = useRef<Array<HTMLSpanElement | null>>([]);
	const [chipWidths, setChipWidths] = useState<number[]>([]);

	// 测量全部 chip 宽度：tags 内容变化时重测（用 length 做依赖，覆盖增删标签场景）
	useLayoutEffect(() => {
		if (tags.length === 0) {
			setChipWidths([]);
			return;
		}
		setChipWidths(measureRefs.current.map((el) => el?.offsetWidth ?? 0));
	}, [tags.length]);

	// 贪心计算可见 chip 数量：始终预留 +N 宽度，避免放下后 +N 挤不下的闪烁
	const visibleCount = useMemo(() => {
		if (containerWidth === 0 || chipWidths.length === 0) return tags.length;
		// 全部放得下时不预留 +N
		const totalWidth = chipWidths.reduce((sum, w) => sum + w, 0) + (tags.length - 1) * CHIP_GAP;
		if (totalWidth <= containerWidth) return tags.length;

		// 预留 +N 后的可用宽度
		const available = containerWidth - PLUS_N_RESERVED_WIDTH;
		let used = 0;
		let count = 0;
		for (let i = 0; i < chipWidths.length; i += 1) {
			const need = chipWidths[i] + (i > 0 ? CHIP_GAP : 0);
			if (used + need > available) break;
			used += need;
			count += 1;
		}
		// 至少显示 1 个，避免只剩 +N 的极端情况
		return Math.max(count, 1);
	}, [containerWidth, chipWidths, tags.length]);

	const visible = tags.slice(0, visibleCount);
	const hiddenCount = tags.length - visible.length;

	return (
		<div
			ref={containerRef}
			className="flex w-full min-w-0 flex-nowrap items-center gap-1 overflow-hidden"
		>
			{/* 测量层：不可见，渲染全部 chip 用于读 offsetWidth；包裹 span 收集 ref */}
			<div
				aria-hidden="true"
				className="pointer-events-none invisible absolute top-0 left-0 flex flex-nowrap items-center gap-1"
			>
				{tags.map((tag, i) => (
					<span
						key={tag.id}
						ref={(el) => {
							measureRefs.current[i] = el;
						}}
						className="inline-flex"
					>
						<TagChip name={tag.name} color={tag.color} />
					</span>
				))}
			</div>
			{visible.map((tag) => (
				<TagChip key={tag.id} name={tag.name} color={tag.color} />
			))}
			{hiddenCount > 0 && (
				<Tooltip>
					<TooltipTrigger
						render={
							<span className="inline-flex h-6 shrink-0 cursor-default select-none items-center rounded-full bg-muted px-2 font-medium text-muted-foreground text-xs">
								+{hiddenCount}
							</span>
						}
					/>
					<TooltipContent className="flex max-w-xs flex-wrap gap-1" showArrow={false}>
						{tags.map((tag) => (
							<TagChip key={tag.id} name={tag.name} color={tag.color} />
						))}
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
};

function RuleTagsCell({ tags }: { tags: RuleListItemVo["tags"] }) {
	if (tags.length === 0) {
		return <span className="text-muted-foreground/50">—</span>;
	}
	return <OverflowTagList tags={tags} />;
}
