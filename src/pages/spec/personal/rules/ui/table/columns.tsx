"use client";

// # 规约表格列定义：对齐 shadcn Data Table 的 ColumnDef 写法
// > 选择 / 名称 / 文件夹 / 标签 / 预览 / 更新时间 / 操作；名称与文件夹截断时 hover 出全文

import type { ColumnDef } from "@tanstack/react-table";
import { TagChip } from "@/features/tag-combobox";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { Checkbox } from "@/shared/ui/checkbox";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { TruncatedTooltip } from "@/shared/ui/truncated-tooltip";
import { TableActions } from "../table-actions";

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
		// 收窄名称列，超长靠 TruncatedTooltip 看全文
		size: 160,
		cell: ({ row }) => (
			<TruncatedTooltip text={String(row.getValue("name") ?? "")} className="font-medium" />
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
		// 预览只截断，不挂 tooltip（后续由后端限长）
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

// > 标签列单元：空态显破折号；非空展示前 3 个只读 chip，超出收成「+N」药丸 hover 看全部
const TAG_PREVIEW_LIMIT = 3;

function RuleTagsCell({ tags }: { tags: RuleListItemVo["tags"] }) {
	if (tags.length === 0) {
		return <span className="text-muted-foreground/50">—</span>;
	}
	const visible = tags.slice(0, TAG_PREVIEW_LIMIT);
	const hiddenCount = tags.length - visible.length;
	return (
		<div className="flex flex-wrap items-center gap-1">
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
					<TooltipContent className="flex max-w-xs flex-wrap gap-1">
						{tags.map((tag) => (
							<TagChip key={tag.id} name={tag.name} color={tag.color} />
						))}
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}
