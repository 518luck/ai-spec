"use client";

// # 通用规格卡片：统一视觉壳 + 可选整卡点击 + 标题/正文/hover 操作；收录与广场等共用
// > 传 onClick 即整卡可点（复制等）；不传则为只读展示卡。loading 用 isPending 蒙层。
// ! 若 onClick 是复制，调用方必须拉全文，绝不能复制列表里的截断 preview
// ! 可点击控件（回链、反馈等）一律放 actions，避免被底部 hover 遮罩挡住

import { motion } from "motion/react";
import type { JSX, ReactNode } from "react";

import { MORPH_RADIUS, MORPH_TRANSITION } from "@/shared/lib/motion";
import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

type ContentCardProps = {
	// 标题
	name: string;
	// 正文区（字符串预览或自定义节点）
	preview?: ReactNode;
	// 可选整卡点击（如复制）；不传则只读
	onClick?: () => void;
	// 整卡点击的无障碍文案（有 onClick 时建议传）
	clickAriaLabel?: string;
	// 整卡操作进行中：蒙层 + 禁用点击
	isPending?: boolean;
	// 底部 hover 操作区（按钮、回链等可点控件放这里）
	actions?: ReactNode;
	// 标题行右侧常驻插槽（收藏★、star 数等）
	headerExtra?: ReactNode;
	// 与弹窗共用的形变锚点
	morphId?: string;
	// 弹窗已接管锚点时淡出本卡
	isMorphing?: boolean;
	// 正文区额外 class（如等宽字体、行数）
	previewClassName?: string;
	// 附加内容（业务弹窗等）
	children?: ReactNode;
	className?: string;
};

export function ContentCard({
	name,
	preview,
	onClick,
	clickAriaLabel = "打开",
	isPending = false,
	actions,
	headerExtra,
	morphId,
	isMorphing = false,
	previewClassName,
	children,
	className,
}: ContentCardProps): JSX.Element {
	const clickable = typeof onClick === "function";

	return (
		<div
			className={cn(
				SHELL_CLASS,
				clickable ? "cursor-pointer" : "cursor-default",
				isMorphing && "opacity-0",
				className,
			)}
		>
			{/* 形变锚点：等大透明矩形，供 motion 测量起点 */}
			{morphId && !isMorphing ? (
				<motion.div
					layoutId={morphId}
					transition={MORPH_TRANSITION}
					style={{ borderRadius: MORPH_RADIUS.card }}
					className="pointer-events-none absolute inset-0"
				/>
			) : null}

			{/* // > 透明点击层：仅在传入 onClick 时渲染；操作按钮 z-index 更高 */}
			{clickable ? (
				<button
					type="button"
					aria-label={clickAriaLabel}
					className="absolute inset-0 z-0"
					onClick={onClick}
					disabled={isPending}
				/>
			) : null}

			{/* 标题行 */}
			<div className="flex items-start justify-between gap-2">
				<h3 className="line-clamp-2 flex-1 font-medium text-sm leading-snug">{name}</h3>
				{headerExtra ? <div className="relative z-10 shrink-0">{headerExtra}</div> : null}
			</div>

			{/* 正文 */}
			{preview != null && preview !== "" ? (
				typeof preview === "string" ? (
					<p
						className={cn(
							"wrap-break-word line-clamp-6 flex-1 whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed",
							previewClassName,
						)}
					>
						{preview}
					</p>
				) : (
					<div className={cn("min-h-0 flex-1", previewClassName)}>{preview}</div>
				)
			) : (
				<p className="flex-1 text-muted-foreground text-xs leading-relaxed">（无内容）</p>
			)}

			{children}

			{/* // 底部渐变操作条：hover 淡入；可点控件统一放 actions */}
			{actions != null ? <div className={ACTIONS_CLASS}>{actions}</div> : null}

			{/* // ! 进行中：半透明蒙层 + spinner */}
			{isPending ? (
				<div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
					<Spinner className="size-5" />
				</div>
			) : null}
		</div>
	);
}

// 容器质感：aspect-4/3 + hover 抬升 + 亮/暗色投影
const SHELL_CLASS = [
	"group relative flex aspect-4/3 flex-col gap-3 overflow-hidden rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5",
	"shadow-[1px_2px_4px_-1px_rgba(0,0,0,0.1),3px_6px_16px_-4px_rgba(0,0,0,0.06)] hover:bg-accent/30 hover:shadow-[1px_2px_4px_-1px_rgba(0,0,0,0.12),6px_12px_28px_-4px_rgba(0,0,0,0.1)]",
	"inset-shadow-[1px_1px_0_white/30] inset-shadow-[-1px_-1px_0_rgba(0,0,0,0.06)]",
	"dark:shadow-none dark:border-white/5 dark:bg-[oklch(0.235_0_0)] dark:inset-shadow-[1px_1px_0_white/8] dark:inset-shadow-[-1px_-1px_0_rgba(0,0,0,0.3)] dark:hover:border-white/10 dark:hover:bg-[oklch(0.265_0_0)]",
].join(" ");

// 底部 hover 操作条（全宽，便于左右分布：来源 | 按钮）
const ACTIONS_CLASS =
	"pointer-events-none absolute inset-x-0 bottom-0 z-10 flex w-full items-center justify-end gap-1 bg-linear-to-t from-foreground/10 via-foreground/5 to-foreground/0 p-2 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100";
