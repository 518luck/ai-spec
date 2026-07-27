"use client";

// # 内容卡片：整卡复制层 + 标题 + 预览，外加底部 hover 操作遮罩；提示词草稿/收录、规约卡片共用
// > 主体（复制层/标题/预览）由本组件内置；actions 放 hover 操作按钮；headerExtra 是标题行右侧常驻插槽；children 留给调用方挂各自业务弹窗
// ! 复制走 onCopy 拉全文，绝不能复制截断的 preview（列表接口只返回预览）。拉取中由调用方传入 isCopying 触发整体 loading 蒙层

import { motion } from "motion/react";
import type { JSX, ReactNode } from "react";

import { MORPH_RADIUS, MORPH_TRANSITION } from "@/shared/lib/motion";
import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

type ContentCardProps = {
	// 标题
	name: string;
	// 正文预览（截断后的内容）
	preview: string;
	// > 点击复制触发器：由调用方实现（拉全文 → copy → toast）；签名同步，loading 由 isCopying 反馈
	onCopy: () => void;
	// 复制进行中（来自调用方的 mutation isMutating）：为 true 时叠加整卡 loading 蒙层并禁用点击
	isCopying?: boolean;
	// 底部 hover 遮罩内的操作按钮；遮罩层永远渲染以保持 hover 视觉一致，按钮可有可无
	actions?: ReactNode;
	// 标题行右侧的常驻插槽（如收藏★按钮）；浮在透明复制层 z-0 之上，z-10 保证可点击
	headerExtra?: ReactNode;
	// > 形变锚点 id：与编辑弹窗共用同一个 layoutId，弹窗打开时由弹窗那侧接管，让面板从这张卡的位置长出来
	morphId?: string;
	// ! 锚点是否已交给弹窗（该卡的编辑弹窗打开中）：为 true 时这侧必须撤掉，同一 layoutId 同时存在两个会互相拉扯
	isMorphing?: boolean;
	// 附加内容（弹窗等非视觉 DOM），渲染在主体之后
	children?: ReactNode;
};

export function ContentCard({
	name,
	preview,
	onCopy,
	isCopying = false,
	actions,
	headerExtra,
	morphId,
	isMorphing = false,
	children,
}: ContentCardProps): JSX.Element {
	return (
		// ! 形变期间整张卡淡出：面板是从这张卡的矩形飞走的，卡还留在原地就会和飞行中的面板凑成一组重影
		<div className={cn(CONTENT_CARD_CLASS, isMorphing && "opacity-0")}>
			{/* 形变锚点：不画任何东西，只提供一个和卡片等大的矩形供 motion 测量起点 */}
			{morphId && !isMorphing ? (
				<motion.div
					layoutId={morphId}
					transition={MORPH_TRANSITION}
					style={{ borderRadius: MORPH_RADIUS.card }}
					className="pointer-events-none absolute inset-0"
				/>
			) : null}
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

			{/* 调用方挂载的附加内容（各自的弹窗） */}
			{children}

			<div
				className={cn(
					// 底部渐变遮罩：hover 卡片时淡入；z-10 让它浮在透明点击层（z-0）之上，按钮可点
					"pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-end gap-1 bg-linear-to-t from-foreground/10 via-foreground/5 to-foreground/0 p-2 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100",
				)}
			>
				{actions}
			</div>

			{/* // ! 复制中：整卡半透明蒙层 + 居中 spinner，阻断重复点击 */}
			{isCopying ? (
				<div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
					<Spinner className="size-5" />
				</div>
			) : null}
		</div>
	);
}

// 卡片容器样式：aspect-4/3 比例 + hover 抬升 + 亮/暗色投影
const CONTENT_CARD_CLASS = [
	// 基础布局
	"group relative flex aspect-4/3 cursor-pointer flex-col gap-3 overflow-hidden rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5",
	// 亮色：右下投影 + inset 左上高光右下暗影（只在边缘做明暗，中间保持平面）
	"shadow-[1px_2px_4px_-1px_rgba(0,0,0,0.1),3px_6px_16px_-4px_rgba(0,0,0,0.06)] hover:bg-accent/30 hover:shadow-[1px_2px_4px_-1px_rgba(0,0,0,0.12),6px_12px_28px_-4px_rgba(0,0,0,0.1)]",
	"inset-shadow-[1px_1px_0_white/30] inset-shadow-[-1px_-1px_0_rgba(0,0,0,0.06)]",
	// 暗色：去掉投影，用表面提亮 + inset 边缘明暗
	"dark:shadow-none dark:border-white/5 dark:bg-[oklch(0.235_0_0)] dark:inset-shadow-[1px_1px_0_white/8] dark:inset-shadow-[-1px_-1px_0_rgba(0,0,0,0.3)] dark:hover:border-white/10 dark:hover:bg-[oklch(0.265_0_0)]",
].join(" ");
