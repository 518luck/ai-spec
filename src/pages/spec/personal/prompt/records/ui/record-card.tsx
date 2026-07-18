"use client";

import copy from "copy-to-clipboard";
import type { JSX } from "react";

import { toast } from "@/features/toast";

type RecordCardProps = {
	// 收录 ID
	id: string;
	// 收录标题（必填，创建时已提取自第一个非空行）
	name: string;
	// 收录预览（截断后的内容）
	preview: string;
};

// 收录卡片样式：外阴影投影 + inset 边缘明暗模拟左上斜打光（与草稿卡片视觉一致）
const CARD_CLASS = [
	// 基础布局
	"group relative flex aspect-4/3 cursor-pointer flex-col gap-3 overflow-hidden rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5",
	// 亮色：右下投影 + inset 左上高光右下暗影（只在边缘做明暗，中间保持平面）
	"shadow-[1px_2px_4px_-1px_rgba(0,0,0,0.1),3px_6px_16px_-4px_rgba(0,0,0,0.06)] hover:bg-accent/30 hover:shadow-[1px_2px_4px_-1px_rgba(0,0,0,0.12),6px_12px_28px_-4px_rgba(0,0,0,0.1)]",
	"inset-shadow-[1px_1px_0_white/30] inset-shadow-[-1px_-1px_0_rgba(0,0,0,0.06)]",
	// 暗色：去掉投影，用表面提亮 + inset 边缘明暗
	"dark:shadow-none dark:border-white/5 dark:bg-[oklch(0.235_0_0)] dark:inset-shadow-[1px_1px_0_white/8] dark:inset-shadow-[-1px_-1px_0_rgba(0,0,0,0.3)] dark:hover:border-white/10 dark:hover:bg-[oklch(0.265_0_0)]",
].join(" ");

// # 收录卡片：内容预览 + 点击复制（简化版，暂无编辑/删除入口）
export function RecordCard({ id: _id, name, preview }: RecordCardProps): JSX.Element {
	// 复制预览文本到剪贴板（用 copy-to-clipboard 自动处理非 HTTPS / 旧浏览器的回退）
	const handleCopy = (): void => {
		copy(preview);
		toast.success("已复制");
	};

	return (
		<div className={CARD_CLASS}>
			{/* // > 透明点击层：覆盖整个卡片，点击即复制 */}
			<button
				type="button"
				aria-label="复制收录内容"
				className="absolute inset-0 z-0"
				onClick={handleCopy}
			/>
			{/* 标题行 */}
			<div className="flex items-start justify-between gap-2">
				<h3 className="line-clamp-2 flex-1 font-medium text-sm leading-snug">{name}</h3>
			</div>

			{/* 内容预览 */}
			<p className="wrap-break-word line-clamp-6 flex-1 whitespace-pre-wrap font-mono text-muted-foreground text-xs leading-relaxed">
				{preview || "（无内容）"}
			</p>
		</div>
	);
}
