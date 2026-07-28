"use client";

// # Skill 广场卡片：名称 + star + 描述 + 署名；描述被 line-clamp 截断时 hover 出全文 Tooltip

import { type JSX, useLayoutEffect, useRef, useState } from "react";

import type { DiscoverSkillListItemVo } from "@/shared/lib/zod/schemas/discover-skill";
import { Badge } from "@/shared/ui/badge";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { SkillDescLang } from "../lib/desc-lang";

type SkillCardProps = {
	skill: DiscoverSkillListItemVo;
	// 描述展示语言：中文优先 descriptionZh，缺译回落原文
	lang?: SkillDescLang;
};

// # Skill 广场卡片：名称 + star 数 + 描述 + 来源署名与回链
export function SkillCard({ skill, lang = "zh" }: SkillCardProps): JSX.Element {
	const { name, description, descriptionZh, license, sourceRepo, sourceUrl, authorName, stars } =
		skill;
	// 中文态：有译用译，无译回落原文；英文态始终原文
	const displayDescription = lang === "zh" ? descriptionZh?.trim() || description : description;

	const descRef = useRef<HTMLParagraphElement>(null);
	// 描述是否被 line-clamp 截断；仅截断时才挂 Tooltip
	const [truncated, setTruncated] = useState(false);

	// 文案或语言变化后测量是否超出 3 行（依赖文案本身，不读 ref 身份）
	// biome-ignore lint/correctness/useExhaustiveDependencies: displayDescription 是测量触发信号，body 只读 DOM 几何
	useLayoutEffect(() => {
		const el = descRef.current;
		if (!el) return;
		setTruncated(el.scrollHeight > el.clientHeight + 1);
	}, [displayDescription]);

	const cardBody = (
		<>
			<div className="flex items-start justify-between gap-2">
				<h3 className="truncate font-semibold text-sm">{name}</h3>
				<span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
					<Icons.star className="size-3.5" />
					{formatStars(stars)}
				</span>
			</div>
			<p ref={descRef} className="line-clamp-3 flex-1 text-muted-foreground text-xs">
				{displayDescription}
			</p>
			{/* // @ 底部署名条：来源仓库 + license + GitHub 回链 */}
			<div className="flex items-center justify-between gap-2 pt-1">
				<span className="truncate text-muted-foreground text-xs">{sourceRepo ?? authorName}</span>
				<div className="flex shrink-0 items-center gap-1.5">
					{license ? (
						<Badge variant="outline" className="max-w-28 truncate text-xs">
							{license}
						</Badge>
					) : null}
					{sourceUrl ? (
						<a
							href={sourceUrl}
							target="_blank"
							rel="noreferrer"
							aria-label="在 GitHub 查看源仓库"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							<Icons.github className="size-4" />
						</a>
					) : null}
				</div>
			</div>
		</>
	);

	const cardClassName =
		"flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-ring/40";

	// 未截断：不包 Tooltip，避免短描述也弹层
	if (!truncated) {
		return <div className={cardClassName}>{cardBody}</div>;
	}

	// 截断：hover 卡片任意位置展示完整描述
	return (
		<Tooltip>
			<TooltipTrigger render={<div className={cardClassName} />}>{cardBody}</TooltipTrigger>
			<TooltipContent
				showArrow={false}
				side="top"
				className="max-w-xs whitespace-pre-wrap text-left leading-relaxed"
			>
				{displayDescription}
			</TooltipContent>
		</Tooltip>
	);
}

// star 数缩写：1240 → "1.2k"，避免长数字撑破卡片
const formatStars = (stars: number): string =>
	stars >= 1000 ? `${(stars / 1000).toFixed(stars >= 10_000 ? 0 : 1)}k` : String(stars);
