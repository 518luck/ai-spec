"use client";

// # 分页栏：左侧「第 X-Y 条，共 Z 条」+ 右侧上一页/下一页按钮

import type { JSX } from "react";

import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";

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
};

// > 通用分页栏：样式与 settings/keys 分页一致，供多处复用
export function PaginationBar({
	page,
	total,
	hasMore,
	pageSize,
	onPageChange,
}: PaginationBarProps): JSX.Element {
	// 根据当前页码计算分页显示信息
	const start = total === 0 ? 0 : page * pageSize + 1;
	const end = Math.min((page + 1) * pageSize, total);

	return (
		<div className="flex items-center justify-between border-t px-4 py-2 text-muted-foreground text-xs">
			<span>
				第 {start}-{end} 条，共 {total} 条
			</span>
			<div className="flex items-center gap-2">
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
