"use client";

// # 规约列表表格：展示规则名称、文件夹、预览及操作列；数据由容器组件传入
// > 整块跟着视图切换进出场，行再按索引错峰淡入

import { AnimatePresence, motion } from "motion/react";
import type { JSX } from "react";

import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/shared/ui/table";
import { EmptyAction } from "@/widgets/empty-state";
import { itemTransition, ROW_ITEM_MOTION } from "../../lib/list-motion";
import { TableActions } from "../table-actions";

type RuleTableProps = {
	rules: RuleListItemVo[];
	isLoading: boolean;
	q?: string;
	onCreate?: () => void;
	// 选中行 ID 集合
	selectedIds: Set<string>;
	// 切换单行选中
	onToggleSelect: (id: string) => void;
	// 全选 / 取消全选
	onToggleSelectAll: () => void;
	// 批量删除
	onBatchDelete: () => void;
	// 清空选择
	onClearSelection: () => void;
};

export function RuleTable({
	rules,
	isLoading,
	q,
	onCreate,
	selectedIds,
	onToggleSelect,
	onToggleSelectAll,
	onBatchDelete,
	onClearSelection,
}: RuleTableProps): JSX.Element {
	const selectionCount = selectedIds.size;
	const hasSelection = selectionCount > 0;
	const allSelected = rules.length > 0 && selectionCount === rules.length;
	const someSelected = selectionCount > 0 && !allSelected;

	// 加载状态
	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
			</div>
		);
	}

	// 空状态：在表格外部显示，避免表格元素的布局限制
	if (rules.length === 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<EmptyAction
					q={q}
					icon={<Icons.rulesLibrary />}
					actionLabel="新增规约"
					onAction={onCreate}
				/>
			</div>
		);
	}

	// 数据列表
	return (
		<div className="flex h-full min-h-0 flex-col">
			<ScrollArea orientation="horizontal" className="min-h-0 flex-1" scrollbarClassName="mx-4">
				<Table className="table-fixed" containerClassName="overflow-x-visible">
					{/* // @ 表头切换：选中时批量操作栏替换列名，进出均带动画 */}
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
									<TableCell colSpan={5} className="p-0">
										<motion.div
											className="flex items-center gap-2 px-4 py-2"
											initial={{ opacity: 0, y: -4 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.18, ease: "easeOut", delay: 0.05 }}
										>
											<Button size="xs" variant="ghost" onClick={onClearSelection}>
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
							<motion.thead
								key="header"
								className="bg-muted"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.15 }}
							>
								<TableRow>
									<TableHead className="w-10 pl-4">
										<Checkbox
											checked={allSelected}
											data-state={someSelected ? "indeterminate" : undefined}
											onCheckedChange={onToggleSelectAll}
											aria-label="全选当前页"
										/>
									</TableHead>
									<TableHead className="w-48">名称</TableHead>
									<TableHead className="w-48">文件夹</TableHead>
									<TableHead>预览</TableHead>
									<TableHead className="w-16 pr-4">操作</TableHead>
								</TableRow>
							</motion.thead>
						)}
					</AnimatePresence>
					<TableBody>
						{rules.map((rule, index) => {
							const isSelected = selectedIds.has(rule.id);
							return (
								<MotionTableRow
									key={rule.id}
									data-state={isSelected ? "selected" : undefined}
									{...ROW_ITEM_MOTION}
									transition={itemTransition(index)}
								>
									<TableCell className="pl-4">
										<Checkbox
											checked={isSelected}
											onCheckedChange={() => onToggleSelect(rule.id)}
											aria-label={`选择 ${rule.name}`}
										/>
									</TableCell>
									<TableCell className="truncate font-medium">{rule.name}</TableCell>
									<TableCell className="text-muted-foreground">
										<span className="flex items-center gap-1.5">
											<Icons.folderClosed className="size-4 shrink-0" />
											<span className="truncate">{rule.folderName || "未分类"}</span>
										</span>
									</TableCell>
									<TableCell className="truncate text-muted-foreground">{rule.preview}</TableCell>
									<TableCell className="pr-4">
										<TableActions rule={rule} />
									</TableCell>
								</MotionTableRow>
							);
						})}
					</TableBody>
				</Table>
			</ScrollArea>
		</div>
	);
}

// 可做动画的表格行：给 TableRow 套一层 motion，让行能按索引错峰淡入
const MotionTableRow = motion.create(TableRow);
