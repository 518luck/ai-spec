"use client";

// # 描述语言切换：单按钮在中文 / 英文间翻转，只影响卡片 description，不改筛选与请求

import type { JSX } from "react";

import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { SkillDescLang } from "../lib/desc-lang";

export type { SkillDescLang } from "../lib/desc-lang";

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
						className="h-9 min-w-9 shrink-0 px-2 font-medium tabular-nums"
					/>
				}
			>
				{label}
			</TooltipTrigger>
			<TooltipContent>{tip}</TooltipContent>
		</Tooltip>
	);
}
