"use client";

import copy from "copy-to-clipboard";
import type { JSX, ReactNode } from "react";

import { toast } from "@/features/toast";
import { PromptCardShell } from "./prompt-card-shell";

// # 标准提示词卡片 —— 草稿与收录共用的卡片形态：复制层 + 标题 + 预览，外加可选的底部 hover 操作遮罩
// > 主体（复制/标题/预览）由本组件内置；actions 用于 hover 操作按钮；children 留给调用方挂各自业务弹窗（如草稿的 EditDraftDialog、收录未来的弹窗）

type PromptCardProps = {
	// 标题
	name: string;
	// 正文预览（截断后的内容）
	preview: string;
	// 透明复制层的 aria-label，默认"复制"
	copyLabel?: string;
	// 底部 hover 遮罩内的操作按钮；不传则不渲染遮罩
	actions?: ReactNode;
	// 附加内容（弹窗等非视觉 DOM），渲染在主体之后
	children?: ReactNode;
};

export function PromptCard({
	name,
	preview,
	copyLabel = "复制",
	actions,
	children,
}: PromptCardProps): JSX.Element {
	// 复制预览文本到剪贴板（用 copy-to-clipboard 自动处理非 HTTPS / 旧浏览器的回退）
	const handleCopy = (): void => {
		copy(preview);
		toast.success("已复制");
	};

	return (
		<PromptCardShell actions={actions}>
			{/* // > 透明点击层：覆盖整个卡片，点击即复制；操作按钮通过 z-index 浮在上层，互不干扰 */}
			<button
				type="button"
				aria-label={copyLabel}
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

			{/* 调用方挂载的附加内容（草稿/收录各自的弹窗） */}
			{children}
		</PromptCardShell>
	);
}
