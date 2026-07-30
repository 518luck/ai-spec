"use client";

// # 规约表格列定义：对齐 shadcn Data Table 的 ColumnDef 写法
// > 选择 / 名称 / 文件夹 / 预览 / 操作；名称与文件夹截断时 hover 出全文

import type { ColumnDef } from "@tanstack/react-table";

import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { Checkbox } from "@/shared/ui/checkbox";
import { Icons } from "@/shared/ui/icons";
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
		accessorKey: "preview",
		header: "预览",
		// 预览只截断，不挂 tooltip（后续由后端限长）
		cell: ({ row }) => (
			<span className="block truncate text-muted-foreground">{row.getValue("preview")}</span>
		),
	},
	{
		id: "actions",
		size: 64,
		enableHiding: false,
		cell: ({ row }) => <TableActions rule={row.original} />,
	},
];
