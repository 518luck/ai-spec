"use client";

// # 规约列表表格：展示规则名称、文件夹、预览及操作列；数据由容器组件传入
// > 整块跟着视图切换进出场，行再按索引错峰淡入

import { motion } from "motion/react";
import type { JSX } from "react";

import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { AnimatedEmptyFolder } from "@/shared/ui/animated-empty-folder";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { itemTransition, ROW_ITEM_MOTION } from "../../lib/list-motion";
import { TableActions } from "../table-actions";

type RuleTableProps = {
	rules: RuleListItemVo[];
	isLoading: boolean;
};

export function RuleTable({ rules, isLoading }: RuleTableProps): JSX.Element {
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
				<AnimatedEmptyFolder
					icon={<Icons.rulesLibrary />}
					title="还没有规约"
					description="点右上角「新增规约」写一条吧"
				/>
			</div>
		);
	}

	// 数据列表
	return (
		<ScrollArea
			orientation="horizontal"
			className="h-full min-h-0 flex-1"
			scrollbarClassName="mx-4"
		>
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
	);
}

// 可做动画的表格行：给 TableRow 套一层 motion，让行能按索引错峰淡入
const MotionTableRow = motion.create(TableRow);
