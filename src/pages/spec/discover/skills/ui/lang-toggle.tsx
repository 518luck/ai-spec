"use client";

// # 描述语言切换：单按钮在中文 / 英文间翻转，只影响卡片 description，不改筛选与请求

import { AnimatePresence, motion } from "motion/react";
import type { JSX } from "react";

import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { SkillDescLang } from "../lib/desc-lang";

export type { SkillDescLang } from "../lib/desc-lang";

// 「中」↔「EN」同槽位切换动效
const LABEL_TRANSITION = { duration: 0.15, ease: "easeOut" } as const;

type SkillLangToggleProps = {
	value: SkillDescLang;
	onChange: (next: SkillDescLang) => void;
};

// > 单按钮切换：当前为中则显示「中」，点一下变 EN；反之亦然
export function SkillLangToggle({ value, onChange }: SkillLangToggleProps): JSX.Element {
	const next: SkillDescLang = value === "zh" ? "en" : "zh";
	const label = value === "zh" ? "中" : "EN";
	// 中文仅影响卡片展示，不改原文
	const tip =
		value === "zh"
			? "当前以中文展示描述（不影响原文），点击切换为英文原文"
			: "当前展示英文原文，点击切换为中文展示";

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						type="button"
						variant="outline"
						size="sm"
						aria-label={tip}
						onClick={() => onChange(next)}
						className="relative h-9 min-w-9 shrink-0 overflow-hidden px-2 font-medium tabular-nums"
					/>
				}
			>
				{/* // 「中」/「EN」同槽位淡入淡出，避免硬切 */}
				<span className="relative inline-flex h-4 min-w-4 items-center justify-center">
					<AnimatePresence initial={false} mode="wait">
						<motion.span
							key={value}
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={LABEL_TRANSITION}
							className="absolute inset-0 flex items-center justify-center"
						>
							{label}
						</motion.span>
					</AnimatePresence>
					{/* // 占位保持按钮宽度稳定（EN 比「中」略宽） */}
					<span className="invisible" aria-hidden>
						{label}
					</span>
				</span>
			</TooltipTrigger>
			<TooltipContent>{tip}</TooltipContent>
		</Tooltip>
	);
}
