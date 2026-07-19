"use client";

import type { JSX, ReactNode } from "react";

import { Spinner } from "@/shared/ui/spinner";
import { PromptCardShell } from "./prompt-card-shell";

// # 标准提示词卡片 —— 草稿与收录共用的卡片形态：复制层 + 标题 + 预览，外加可选的底部 hover 操作遮罩
// > 主体（复制/标题/预览）由本组件内置；actions 用于 hover 操作按钮；children 留给调用方挂各自业务弹窗（如草稿的 EditDraftDialog、收录未来的弹窗）
// ! 复制走 onCopy 拉全文，绝不能复制截断的 preview（列表接口只返回 120 字预览）。拉取中由调用方传入 isCopying 触发整体 loading 蒙层

type PromptCardProps = {
	// 标题
	name: string;
	// 正文预览（截断后的内容）
	preview: string;
	// > 点击复制触发器：由调用方用 useSWRMutation 实现（拉全文 → copy → toast）；签名同步，loading 由 isCopying 反馈
	onCopy: () => void;
	// 复制进行中（来自调用方的 mutation isMutating）：为 true 时叠加整卡 loading 蒙层并禁用点击
	isCopying?: boolean;
	// 底部 hover 遮罩内的操作按钮；遮罩层永远渲染以保持 hover 视觉一致，按钮可有可无
	actions?: ReactNode;
	// 标题行右侧的常驻插槽（如收藏★按钮）；浮在透明复制层 z-0 之上，z-10 保证可点击
	headerExtra?: ReactNode;
	// 附加内容（弹窗等非视觉 DOM），渲染在主体之后
	children?: ReactNode;
};

export function PromptCard({
	name,
	preview,
	onCopy,
	isCopying = false,
	actions,
	headerExtra,
	children,
}: PromptCardProps): JSX.Element {
	return (
		<PromptCardShell actions={actions}>
			{/* // > 透明点击层：覆盖整个卡片，点击即触发调用方拉全文并复制；操作按钮通过 z-index 浮在上层，互不干扰 */}
			<button
				type="button"
				aria-label="复制"
				className="absolute inset-0 z-0"
				onClick={onCopy}
				disabled={isCopying}
			/>
			{/* 标题行 */}
			<div className="flex items-start justify-between gap-2">
				<h3 className="line-clamp-2 flex-1 font-medium text-sm leading-snug">{name}</h3>
				{headerExtra ? <div className="relative z-10 shrink-0">{headerExtra}</div> : null}
			</div>

			{/* 内容预览 */}
			<p className="wrap-break-word line-clamp-6 flex-1 whitespace-pre-wrap font-mono text-muted-foreground text-xs leading-relaxed">
				{preview || "（无内容）"}
			</p>

			{/* 调用方挂载的附加内容（草稿/收录各自的弹窗） */}
			{children}

			{/* // ! 复制中：整卡半透明蒙层 + 居中 spinner，阻断重复点击 */}
			{isCopying ? (
				<div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
					<Spinner className="size-5" />
				</div>
			) : null}
		</PromptCardShell>
	);
}
