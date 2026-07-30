"use client";

// # 分页栏：每页条数选择器 + 范围摘要 + 首页/上一页/下一页按钮

import { AnimatePresence, motion } from "motion/react";
import type { JSX } from "react";

import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

// 默认可选的每页条数
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type PaginationBarProps = {
	// 当前页码（0-based，由列表容器维护）
	page: number;
	// 数据总条数（来自 API）
	total: number;
	// 是否有下一页（来自 API）
	hasMore: boolean;
	// 每页条数（需与后端 / 查询层保持一致）
	pageSize: number;
	// 翻页方向回调
	onPageChange: (direction: "prev" | "next") => void;
	// 可选：每页条数选项列表
	pageSizeOptions?: readonly number[];
	// 可选：每页条数变更回调
	onPageSizeChange?: (pageSize: number) => void;
	// 可选：回到首页回调
	onFirstPage?: () => void;
};

// > 通用分页栏：支持每页条数切换和快速回到首页
export function PaginationBar({
	page,
	total,
	hasMore,
	pageSize,
	onPageChange,
	pageSizeOptions,
	onPageSizeChange,
	onFirstPage,
}: PaginationBarProps): JSX.Element {
	// 根据当前页码计算分页显示信息
	const start = total === 0 ? 0 : page * pageSize + 1;
	const end = Math.min((page + 1) * pageSize, total);

	// 解析实际使用的每页条数选项，未传则用默认值
	const options = pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;

	// 是否显示每页条数选择器
	const showPageSizeSelector = options.length > 0 && onPageSizeChange;

	// 构造 Select 所需的数据格式
	const pageSizeItems = showPageSizeSelector
		? options.map((size) => ({
				label: `每页 ${size} 条`,
				value: String(size),
			}))
		: [];

	return (
		<div className="flex shrink-0 items-center justify-between border-t px-4 py-2 text-muted-foreground text-xs">
			<span>
				第 {start}-{end} 条，共 {total} 条
			</span>
			<div className="flex items-center gap-2">
				{/* // @ 首页按钮：翻到后面时带动画出现/消失 */}
				<AnimatePresence>
					{onFirstPage && page > 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
						>
							<Button variant="outline" size="sm" onClick={onFirstPage} aria-label="首页">
								<Icons.chevronLeftPipe data-icon="inline-start" />
							</Button>
						</motion.div>
					)}
				</AnimatePresence>
				{/* // @ 每页条数选择器 */}
				{showPageSizeSelector && (
					<Select
						items={pageSizeItems}
						value={String(pageSize)}
						onValueChange={(value) => {
							if (value) onPageSizeChange?.(Number(value));
						}}
					>
						<SelectTrigger size="sm" className="h-7 gap-1 text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{pageSizeItems.map((item) => (
									<SelectItem key={item.value} value={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				)}

				<Button
					variant="outline"
					size="sm"
					disabled={page === 0}
					onClick={() => onPageChange("prev")}
					aria-label="上一页"
				>
					<Icons.chevronLeft data-icon="inline-start" />
					上一页
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={!hasMore}
					onClick={() => onPageChange("next")}
					aria-label="下一页"
				>
					下一页
					<Icons.chevronRight data-icon="inline-end" />
				</Button>
			</div>
		</div>
	);
}
