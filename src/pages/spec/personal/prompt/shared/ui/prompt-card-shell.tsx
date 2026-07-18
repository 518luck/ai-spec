import type { JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

// # 提示词卡片外壳 —— 草稿与收录卡片共享的外层容器，统一样式、group 状态、底部 hover 遮罩
// > 仅包外层 div（含 group class）+ 可选的底部 hover 操作遮罩；标题/预览/主体由调用方通过 children 自由填入，遮罩内的操作按钮通过 actions 传入

type PromptCardShellProps = {
	children: ReactNode;
	// 底部 hover 遮罩内的操作按钮；遮罩层永远渲染以保持 hover 视觉一致，按钮可有可无
	actions?: ReactNode;
};

export function PromptCardShell({ children, actions }: PromptCardShellProps): JSX.Element {
	return (
		<div className={PROMPT_CARD_CLASS}>
			{children}
			<div
				className={cn(
					// 底部渐变遮罩：hover 卡片时淡入；z-10 让它浮在透明点击层（z-0）之上，按钮可点
					"pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-end gap-1 bg-linear-to-t from-foreground/10 via-foreground/5 to-foreground/0 p-2 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100",
				)}
			>
				{actions}
			</div>
		</div>
	);
}

// 卡片容器样式：aspect-4/3 比例 + hover 抬升 + 亮/暗色投影
const PROMPT_CARD_CLASS = [
	// 基础布局
	"group relative flex aspect-4/3 cursor-pointer flex-col gap-3 overflow-hidden rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5",
	// 亮色：右下投影 + inset 左上高光右下暗影（只在边缘做明暗，中间保持平面）
	"shadow-[1px_2px_4px_-1px_rgba(0,0,0,0.1),3px_6px_16px_-4px_rgba(0,0,0,0.06)] hover:bg-accent/30 hover:shadow-[1px_2px_4px_-1px_rgba(0,0,0,0.12),6px_12px_28px_-4px_rgba(0,0,0,0.1)]",
	"inset-shadow-[1px_1px_0_white/30] inset-shadow-[-1px_-1px_0_rgba(0,0,0,0.06)]",
	// 暗色：去掉投影，用表面提亮 + inset 边缘明暗
	"dark:shadow-none dark:border-white/5 dark:bg-[oklch(0.235_0_0)] dark:inset-shadow-[1px_1px_0_white/8] dark:inset-shadow-[-1px_-1px_0_rgba(0,0,0,0.3)] dark:hover:border-white/10 dark:hover:bg-[oklch(0.265_0_0)]",
].join(" ");
