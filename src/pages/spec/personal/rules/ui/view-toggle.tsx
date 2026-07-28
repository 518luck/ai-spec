"use client";

// # 列表视图切换：表格 / 卡片两态胶囊按钮，受控组件，选中值由页面持有并同步进 URL ?view=
// > 视图状态放 URL 而不是 localStorage：与本页其它筛选（folderId/tagIds/q）一致，SSR 与客户端首屏读到同一份，不会 hydration 打架

import { motion } from "motion/react";
import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

// 列表视图：表格（默认）或卡片网格
export type RuleViewType = "table" | "grid";

// URL 参数名；缺省或非法值一律回落表格
export const RULE_VIEW_PARAM = "view";

// 从 URL 参数解析视图，只认 "grid"，其余都是表格
export const parseView = (value: string | undefined | null): RuleViewType =>
	value === "grid" ? "grid" : "table";

const VIEW_OPTIONS = [
	{ value: "table", label: "表格", icon: Icons.viewTable },
	{ value: "grid", label: "卡片", icon: Icons.viewGrid },
] as const satisfies readonly {
	value: RuleViewType;
	label: string;
	icon: typeof Icons.viewTable;
}[];

// > 选中态胶囊的共享布局 id：两个按钮下渲染的是同一个 layoutId，motion 会把它从旧位置平移到新位置，而不是一边消失一边出现
const VIEW_INDICATOR_LAYOUT_ID = "rule-view-indicator";

type ViewToggleProps = {
	// 当前选中的视图
	value: RuleViewType;
	// 点击切换；写 URL 由调用方负责
	onChange: (next: RuleViewType) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps): JSX.Element {
	return (
		<div className="flex h-9 shrink-0 items-center gap-0.5 rounded-md border p-0.5">
			{VIEW_OPTIONS.map((option) => (
				<Tooltip key={option.value}>
					<TooltipTrigger
						render={
							<button
								type="button"
								aria-label={`${option.label}视图`}
								aria-pressed={value === option.value}
								onClick={() => onChange(option.value)}
								className={cn(
									"group/view relative inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground",
									value === option.value && "text-foreground",
								)}
							/>
						}
					>
						{/* 选中态背景：只挂在当前选中的按钮下，靠 layoutId 在两个按钮之间滑动 */}
						{value === option.value ? (
							<motion.span
								layoutId={VIEW_INDICATOR_LAYOUT_ID}
								className="absolute inset-0 rounded-sm bg-accent"
								transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
							/>
						) : null}
						{/* relative 让图标压在胶囊背景之上；按下时轻微回缩给点手感 */}
						<option.icon className="relative size-4 transition-transform duration-150 group-active/view:scale-90" />
					</TooltipTrigger>
					<TooltipContent>{option.label}</TooltipContent>
				</Tooltip>
			))}
		</div>
	);
}
