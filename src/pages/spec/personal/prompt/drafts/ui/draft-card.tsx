"use client";

import type { JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";
import { formatRelativeTime, getDraftTitle, truncateContent } from "../lib/format";

type DraftCardProps = {
	// 草稿 ID
	id: string;
	// 草稿标题（可为空，为空时用内容生成）
	name: string | null;
	// 草稿正文
	content: string;
	// 更新时间（ISO 字符串），展示相对时间
	updatedAt: string;
};

// # 草稿卡片：内容预览 + 时间 + 复制/更多操作
export function DraftCard({ id, name, content, updatedAt }: DraftCardProps): JSX.Element {
	const title = getDraftTitle(name, content);
	const preview = truncateContent(content);

	// 复制草稿全文到剪贴板
	const handleCopy = async (): Promise<void> => {
		try {
			await navigator.clipboard.writeText(content);
			toast.success("已复制");
		} catch {
			toast.error("复制失败，请手动复制");
		}
	};

	return (
		<div className="group relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30">
			{/* 标题行：标题 + 更多操作 */}
			<div className="flex items-start justify-between gap-2">
				<h3 className="line-clamp-2 flex-1 font-medium text-sm leading-snug">{title}</h3>
				<DraftActions id={id} />
			</div>

			{/* 内容预览 */}
			<p className="wrap-break-word line-clamp-6 flex-1 whitespace-pre-wrap font-mono text-muted-foreground text-xs leading-relaxed">
				{preview || "（无内容）"}
			</p>

			{/* 底部：时间 + 复制按钮 */}
			<div className="flex items-center justify-between">
				<span className="text-muted-foreground text-xs">{formatRelativeTime(updatedAt)}</span>
				<Button variant="ghost" size="xs" onClick={handleCopy}>
					<Icons.copy data-icon="inline-start" />
					复制
				</Button>
			</div>
		</div>
	);
}

// ? 草稿卡片右上角"更多"菜单（编辑/删除/转正），目前均为占位，功能待实现
function DraftActions({ id: _id }: { id: string }): JSX.Element {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
						aria-label="更多操作"
					/>
				}
			>
				<Icons.more className="size-4" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => toast.info("编辑功能即将上线")}>
					<Icons.pencil data-icon="inline-start" />
					编辑
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => toast.info("转正功能即将上线")}>
					<Icons.promote data-icon="inline-start" />
					转正为收录
				</DropdownMenuItem>
				<DropdownMenuItem variant="destructive" onClick={() => toast.info("删除功能即将上线")}>
					<Icons.trash data-icon="inline-start" />
					删除
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
