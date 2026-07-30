"use client";

// # 规约表格列定义：对齐 shadcn Data Table 的 ColumnDef 写法
// > 选择 / 名称 / 文件夹 / 预览 / 操作；渲染细节下沉到 cell，表格本体只 flexRender

import type { ColumnDef } from "@tanstack/react-table";

import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { Checkbox } from "@/shared/ui/checkbox";
import { Icons } from "@/shared/ui/icons";
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
		size: 192,
		cell: ({ row }) => <span className="truncate font-medium">{row.getValue("name")}</span>,
	},
	{
		id: "folder",
		accessorKey: "folderName",
		header: "文件夹",
		size: 192,
		cell: ({ row }) => (
			<span className="flex items-center gap-1.5 text-muted-foreground">
				<Icons.folderClosed className="size-4 shrink-0" />
				<span className="truncate">{row.original.folderName || "未分类"}</span>
			</span>
		),
	},
	{
		accessorKey: "preview",
		header: "预览",
		cell: ({ row }) => (
			<span className="truncate text-muted-foreground">{row.getValue("preview")}</span>
		),
	},
	{
		id: "actions",
		size: 64,
		enableHiding: false,
		cell: ({ row }) => <TableActions rule={row.original} />,
	},
];
