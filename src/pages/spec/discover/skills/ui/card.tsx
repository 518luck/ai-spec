"use client";

// # Skill 广场卡片：footer 展示来源/协议；actions 放回链与反馈（hover 时 footer 淡出）

import { type JSX, useState } from "react";

import type { DiscoverSkillListItemVo } from "@/shared/lib/zod/schemas/discover-skill";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ContentCard } from "@/shared/ui/content-card";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { DescLang } from "../lib/desc-lang";

import { ReportDialog } from "./report-dialog";

type CardProps = {
	skill: DiscoverSkillListItemVo;
	// 描述展示语言：中文优先 descriptionZh，缺译回落原文
	lang?: DescLang;
	// 是否允许反馈（需登录）
	canReport?: boolean;
	// 本会话是否已反馈
	reported?: boolean;
	// 反馈成功后回写页面状态
	onReported?: (skillId: string) => void;
};

// # Skill 广场卡片：只读 ContentCard；静态信息走 footer，可点控件走 actions
export function Card({
	skill,
	lang = "zh",
	canReport = false,
	reported = false,
	onReported,
}: CardProps): JSX.Element {
	const {
		id,
		name,
		description,
		descriptionZh,
		license,
		sourceRepo,
		sourceUrl,
		authorName,
		stars,
	} = skill;
	const displayDescription = lang === "zh" ? descriptionZh?.trim() || description : description;
	const licenseLabel = license?.trim() || "无协议";
	const repoHref = sourceUrl ?? (sourceRepo ? `https://github.com/${sourceRepo}` : null);
	const sourceLabel = sourceRepo ?? authorName ?? "";

	const [reportOpen, setReportOpen] = useState(false);

	// 描述偏长时给全文 Tooltip
	const showDescTooltip = displayDescription.length > 80;

	const card = (
		<ContentCard
			name={name}
			preview={displayDescription}
			headerExtra={
				<span className="flex items-center gap-1 pt-0.5 text-muted-foreground text-xs">
					<Icons.star className="size-3.5" />
					{formatStars(stars)}
				</span>
			}
			footer={
				<div className="flex w-full min-w-0 items-center justify-between gap-2">
					<span className="min-w-0 truncate text-muted-foreground text-xs">{sourceLabel}</span>
					<Badge variant="outline" className="max-w-24 shrink-0 truncate text-xs">
						{licenseLabel}
					</Badge>
				</div>
			}
			actions={
				<>
					{repoHref ? (
						<a
							href={repoHref}
							target="_blank"
							rel="noreferrer"
							aria-label="在 GitHub 查看源仓库"
							className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
							onClick={(e) => e.stopPropagation()}
						>
							<Icons.github className="size-4" />
						</a>
					) : null}
					{canReport ? (
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							disabled={reported}
							aria-label={reported ? "已反馈" : "反馈此 Skill"}
							title={reported ? "已反馈" : "反馈"}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								if (!reported) setReportOpen(true);
							}}
						>
							<Icons.flag className="size-4" />
						</Button>
					) : null}
				</>
			}
		/>
	);

	return (
		<>
			<div className="w-full min-w-0">
				{showDescTooltip ? (
					<Tooltip>
						<TooltipTrigger render={<div className="w-full min-w-0" />}>{card}</TooltipTrigger>
						<TooltipContent
							showArrow={false}
							side="top"
							className="max-w-xs whitespace-pre-wrap text-left leading-relaxed"
						>
							{displayDescription}
						</TooltipContent>
					</Tooltip>
				) : (
					card
				)}
			</div>
			{canReport ? (
				<ReportDialog
					skillId={id}
					skillName={name}
					open={reportOpen}
					onOpenChange={setReportOpen}
					onReported={(reportedId) => onReported?.(reportedId)}
				/>
			) : null}
		</>
	);
}

// star 数缩写：1240 → "1.2k"
const formatStars = (stars: number): string =>
	stars >= 1000 ? `${(stars / 1000).toFixed(stars >= 10_000 ? 0 : 1)}k` : String(stars);
