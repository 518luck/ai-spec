"use client";

// # 规约 Data Table：TanStack Table + shadcn Table，列由 columns 定义，行由 flexRender 输出
// > 外层滚动 + sticky 表头；选中时表头切成批量操作栏；最少 10 行高度

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type OnChangeFn,
	type RowSelectionState,
	useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import type { JSX } from "react";

import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { Separator } from "@/shared/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { EmptyAction } from "@/widgets/empty-state";
import { itemTransition, ROW_ITEM_MOTION } from "../../lib/list-motion";

// 单行高度（TableCell p-2 + 行内内容 + border-b）
const TABLE_ROW_HEIGHT = 41;
// 表头高度（TableHead h-10）
const TABLE_HEADER_HEIGHT = 40;
// 滚动区最少撑满表头 + 默认 10 行，避免行数变化时外层跟着跳
const SCROLL_MIN_HEIGHT = TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT * 10;
// 分页约 49px，给滚动区留出视口上限
const SCROLL_MAX_HEIGHT = "calc(100dvh - 13rem - 3rem)";

// 可做动画的表格行：给 TableRow 套一层 motion，让行能按索引错峰淡入
const MotionTableRow = motion.create(TableRow);

type RuleDataTableProps = {
	columns: ColumnDef<RuleListItemVo, unknown>[];
	data: RuleListItemVo[];
	isLoading: boolean;
	q?: string;
	onCreate?: () => void;
	// 受控行选择（与容器 ConfirmDialog 共用）
	rowSelection: RowSelectionState;
	onRowSelectionChange: OnChangeFn<RowSelectionState>;
	// 批量删除
	onBatchDelete: () => void;
};

// 规约列表 Data Table：官方 useReactTable + flexRender 渲染
export function RuleTable({
	columns,
	data,
	isLoading,
	q,
	onCreate,
	rowSelection,
	onRowSelectionChange,
	onBatchDelete,
}: RuleDataTableProps): JSX.Element {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row.id,
		onRowSelectionChange,
		enableRowSelection: true,
		// 分页由 URL + 服务端负责，这里不做客户端分页
		manualPagination: true,
		state: {
			rowSelection,
		},
	});

	const selectionCount = table.getFilteredSelectedRowModel().rows.length;
	const hasSelection = selectionCount > 0;

	// 加载状态：高度对齐 10 行列表区，避免和列表态互相跳
	if (isLoading) {
		return (
			<div
				className="flex items-center justify-center text-muted-foreground"
				style={{ minHeight: SCROLL_MIN_HEIGHT }}
			>
				<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
			</div>
		);
	}

	// 空状态：在表格外部显示，高度同样对齐 10 行列表区
	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center" style={{ minHeight: SCROLL_MIN_HEIGHT }}>
				<EmptyAction
					q={q}
					icon={<Icons.rulesLibrary />}
					actionLabel="新增规约"
					onAction={onCreate}
				/>
			</div>
		);
	}

	// 数据列表：单表 + sticky 表头；选中时表头切批量操作栏
	return (
		<div
			className="scrollbar-thin overflow-auto"
			style={{ minHeight: SCROLL_MIN_HEIGHT, maxHeight: SCROLL_MAX_HEIGHT }}
		>
			<Table className="table-fixed" containerClassName="overflow-x-visible">
				{/* // ! colgroup 按 ColumnDef.size 锁列宽；未声明 size 的列吃剩余宽度 */}
				<colgroup>
					{table.getAllLeafColumns().map((column) => (
						<col
							key={column.id}
							style={column.columnDef.size ? { width: column.columnDef.size } : undefined}
						/>
					))}
				</colgroup>

				{/* // @ 表头：默认 flexRender 列头；有选中时换成批量操作栏 */}
				<AnimatePresence mode="wait">
					{hasSelection ? (
						<motion.thead
							key="batch"
							className="sticky top-0 z-10"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
						>
							<TableRow className="border-b bg-accent/30 hover:bg-accent/30">
								<TableCell colSpan={columns.length} className="p-0">
									<motion.div
										className="flex items-center gap-2 px-4 py-2"
										initial={{ opacity: 0, y: -4 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.18, ease: "easeOut", delay: 0.05 }}
									>
										<Button
											size="xs"
											variant="ghost"
											onClick={() => table.toggleAllPageRowsSelected(false)}
										>
											取消选择
										</Button>
										<Separator orientation="vertical" className="h-4" />
										<Button size="xs" variant="destructive" onClick={onBatchDelete}>
											<Icons.trash className="mr-1 size-3" />
											批量删除
										</Button>
										<span className="ml-auto text-muted-foreground text-sm">
											已选 {selectionCount} 项
										</span>
									</motion.div>
								</TableCell>
							</TableRow>
						</motion.thead>
					) : (
						<TableHeader key="header" className="sticky top-0 z-10 bg-muted">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead
											key={header.id}
											className={
												header.id === "select"
													? "pl-4"
													: header.id === "actions"
														? "pr-4"
														: undefined
											}
										>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
					)}
				</AnimatePresence>

				<TableBody>
					{table.getRowModel().rows.map((row, index) => (
						<MotionTableRow
							key={row.id}
							data-state={row.getIsSelected() ? "selected" : undefined}
							{...ROW_ITEM_MOTION}
							transition={itemTransition(index)}
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={cell.id}
									className={
										cell.column.id === "select"
											? "pl-4"
											: cell.column.id === "actions"
												? "pr-4"
												: undefined
									}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</MotionTableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
