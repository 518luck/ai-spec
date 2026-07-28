"use client";

// # 规约列表表格：展示规则名称、文件夹、预览及操作列；数据由 RuleList 统一拉取后传入
// > 整块跟着视图切换进出场，行再按索引错峰淡入

import { motion } from "motion/react";
import type { JSX } from "react";

import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { Icons } from "@/shared/ui/icons";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { itemTransition, LIST_SWITCH_MOTION, ROW_ITEM_MOTION } from "../lib/list-motion";
import { TableActions } from "./table-actions";

type RuleTableProps = {
	rules: RuleListItemVo[];
};

export function RuleTable({ rules }: RuleTableProps): JSX.Element {
	return (
		<motion.div
			className="flex h-full flex-col overflow-hidden rounded-lg border"
			{...LIST_SWITCH_MOTION}
		>
			<ScrollArea orientation="horizontal" className="min-h-0 flex-1" scrollbarClassName="mx-4">
				<Table className="table-fixed" containerClassName="overflow-x-visible">
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead className="w-48 pl-4">名称</TableHead>
							<TableHead className="w-48">文件夹</TableHead>
							<TableHead>预览</TableHead>
							<TableHead className="w-16 pr-4">操作</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rules.map((rule, index) => (
							<MotionTableRow key={rule.id} {...ROW_ITEM_MOTION} transition={itemTransition(index)}>
								<TableCell className="truncate pl-4 font-medium">{rule.name}</TableCell>
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
						))}
					</TableBody>
				</Table>
			</ScrollArea>
		</motion.div>
	);
}

// 可做动画的表格行：给 TableRow 套一层 motion，让行能按索引错峰淡入
const MotionTableRow = motion.create(TableRow);
