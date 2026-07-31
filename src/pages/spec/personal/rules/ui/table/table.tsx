"use client";

// # 规约 Data Table：TanStack Table + shadcn Table，列由 columns 定义，行由 flexRender 输出
// > 表头始终在；body 独立滚动且最少 10 行（空态/加载同高）；选中时表头切批量操作栏

import {
	type Column,
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type OnChangeFn,
	type RowSelectionState,
	useReactTable,
	type VisibilityState,
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
const TABLE_ROW_HEIGHT = 45;
// body 最少撑满默认 10 条；空态/加载/有数据共用，避免高度跳变
const BODY_MIN_HEIGHT = TABLE_ROW_HEIGHT * 10;
// 表头约 40px、分页约 49px，给 body 留出视口上限
const BODY_MAX_HEIGHT = "calc(100dvh - 13rem - 5.5rem)";

// 可做动画的表格行：给 TableRow 套一层 motion，让行能按索引错峰淡入
const MotionTableRow = motion.create(TableRow);

// 选择/操作列边距；文本列 overflow-hidden，配合 truncate 吃掉超长内容，禁止撑出横向滚动
const cellClassName = (columnId: string): string => {
	if (columnId === "select") return "overflow-hidden pl-4";
	if (columnId === "actions") return "overflow-hidden pr-4";
	// max-w-0：table-fixed 下让弹性列按 col 宽收缩，truncate 才能生效
	return "max-w-0 overflow-hidden";
};

// 表头与 body 共用 colgroup，按 ColumnDef.size 锁列宽
const ColumnGroup = ({ columns }: { columns: Column<RuleListItemVo, unknown>[] }): JSX.Element => (
	<colgroup>
		{columns.map((column) => (
			<col
				key={column.id}
				style={column.columnDef.size ? { width: column.columnDef.size } : undefined}
			/>
		))}
	</colgroup>
);

type RuleDataTableProps = {
	columns: ColumnDef<RuleListItemVo, unknown>[];
	data: RuleListItemVo[];
	isLoading: boolean;
	q?: string;
	onCreate?: () => void;
	// 受控行选择（与容器 ConfirmDialog 共用）
	rowSelection: RowSelectionState;
	onRowSelectionChange: OnChangeFn<RowSelectionState>;
	// 受控列可见性（由容器持久化到 localStorage）
	columnVisibility: VisibilityState;
	onColumnVisibilityChange: OnChangeFn<VisibilityState>;
	// 批量删除
	onBatchDelete: () => void;
};

// 规约列表 Data Table：官方 useReactTable + flexRender；表头固定，body 独立滚动
export function RuleTable({
	columns,
	data,
	isLoading,
	q,
	onCreate,
	rowSelection,
	onRowSelectionChange,
	columnVisibility,
	onColumnVisibilityChange,
	onBatchDelete,
}: RuleDataTableProps): JSX.Element {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row.id,
		onRowSelectionChange,
		onColumnVisibilityChange,
		enableRowSelection: true,
		// 分页由 URL + 服务端负责，这里不做客户端分页
		manualPagination: true,
		state: {
			rowSelection,
			columnVisibility,
		},
	});

	// > 只取可见列生成 colgroup：隐藏列不参与宽度分配，避免 table-fixed 下列宽重排
	const leafColumns = table.getVisibleLeafColumns();
	const selectionCount = table.getFilteredSelectedRowModel().rows.length;
	const hasSelection = selectionCount > 0;
	const rows = table.getRowModel().rows;

	// body 内容：加载 / 空态 / 行列表，三者都落在同一最小高度的滚动壳里
	// ! 空/载不要用 h-full：父级只有 minHeight 时百分比高度算不出来，flex 居中会贴顶
	const bodyContent = (() => {
		if (isLoading) {
			return (
				<div
					className="flex items-center justify-center text-muted-foreground"
					style={{ minHeight: BODY_MIN_HEIGHT }}
				>
					<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
				</div>
			);
		}

		if (rows.length === 0) {
			return (
				<div className="flex items-center justify-center" style={{ minHeight: BODY_MIN_HEIGHT }}>
					<EmptyAction
						q={q}
						icon={<Icons.rulesLibrary />}
						actionLabel="新增规约"
						onAction={onCreate}
					/>
				</div>
			);
		}

		return (
			<Table className="w-full table-fixed" containerClassName="overflow-x-hidden">
				<ColumnGroup columns={leafColumns} />
				<TableBody>
					{rows.map((row, index) => (
						<MotionTableRow
							key={row.id}
							data-state={row.getIsSelected() ? "selected" : undefined}
							{...ROW_ITEM_MOTION}
							transition={itemTransition(index)}
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id} className={cellClassName(cell.column.id)}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</MotionTableRow>
					))}
				</TableBody>
			</Table>
		);
	})();

	// 表头始终渲染 + body 固定最小高度，空/载/有数据总高度一致
	return (
		<div>
			{/* // @ 表头：不滚动；选中时切成批量操作栏；空态也保留，避免总高低一截 */}
			<Table className="table-fixed" containerClassName="overflow-x-hidden">
				<ColumnGroup columns={leafColumns} />
				<AnimatePresence mode="wait">
					{hasSelection ? (
						<motion.thead
							key="batch"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
						>
							<TableRow className="border-b bg-accent/30 hover:bg-accent/30">
								<TableCell colSpan={columns.length} className="overflow-hidden p-0">
									<motion.div
										className="flex min-w-0 items-center gap-2 px-4 py-2"
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
										<span className="ml-auto truncate text-muted-foreground text-sm">
											已选 {selectionCount} 项
										</span>
									</motion.div>
								</TableCell>
							</TableRow>
						</motion.thead>
					) : (
						<TableHeader key="header" className="bg-muted">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id} className={cellClassName(header.id)}>
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
			</Table>

			{/* // > body 只纵向滚动；minHeight 固定 10 行，空/载/有数据同高 */}
			<div
				className="scrollbar-thin overflow-y-auto overflow-x-hidden"
				style={{ minHeight: BODY_MIN_HEIGHT, maxHeight: BODY_MAX_HEIGHT }}
			>
				{bodyContent}
			</div>
		</div>
	);
}
