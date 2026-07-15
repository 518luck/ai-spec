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
import { getDraftTitle, truncateContent } from "../lib/format";
import { HoverOverlay } from "./hover-overlay";

type DraftCardProps = {
	// 草稿 ID
	id: string;
	// 草稿标题（可为空，为空时用内容生成）
	name: string | null;
	// 草稿正文
	content: string;
};

// 草稿卡片样式：亮色用阴影表达立体感，暗色用表面提亮替代阴影
const CARD_CLASS = [
	// 基础布局
	"group relative flex aspect-4/3 cursor-pointer flex-col gap-3 overflow-hidden rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5",
	// 亮色：阴影 + hover 加深
	"shadow-[2px_4px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-accent/30 hover:shadow-[4px_8px_20px_-2px_rgba(0,0,0,0.12)]",
	// 暗色：去掉阴影，用表面提亮 + 微弱边框
	"dark:shadow-none dark:border-white/5 dark:bg-[oklch(0.235_0_0)] dark:hover:border-white/10 dark:hover:bg-[oklch(0.265_0_0)]",
].join(" ");

// # 草稿卡片：内容预览 + 复制/更多操作
export function DraftCard({ id, name, content }: DraftCardProps): JSX.Element {
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
		<div className={CARD_CLASS}>
			{/* // > 透明点击层：覆盖整个卡片，点击即复制；操作按钮通过 z-index 浮在上层，互不干扰 */}
			<button
				type="button"
				aria-label="复制草稿"
				className="absolute inset-0 z-0"
				onClick={handleCopy}
			/>
			{/* 标题行 */}
			<div className="flex items-start justify-between gap-2">
				<h3 className="line-clamp-2 flex-1 font-medium text-sm leading-snug">{title}</h3>
			</div>

			{/* 内容预览 */}
			<p className="wrap-break-word line-clamp-6 flex-1 whitespace-pre-wrap font-mono text-muted-foreground text-xs leading-relaxed">
				{preview || "（无内容）"}
			</p>

			{/* // > 底部操作遮罩：hover 卡片时淡入显示查看/更多操作（点击卡片即可复制） */}
			<HoverOverlay className="z-10">
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="查看"
					onClick={() => toast.info("查看功能即将上线")}
				>
					<Icons.eye className="size-4" />
				</Button>
				<DraftActions id={id} />
			</HoverOverlay>
		</div>
	);
}

// ? 底部操作栏的"更多"菜单（编辑/删除/转正），目前均为占位，功能待实现
function DraftActions({ id: _id }: { id: string }): JSX.Element {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="icon-sm" aria-label="更多操作">
						<Icons.more className="size-4" />
					</Button>
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
