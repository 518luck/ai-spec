"use client";

// # Skill 广场卡片：通用 ContentCard；来源/回链/反馈放 actions，尺寸与收录卡对齐

import { type JSX, useState } from "react";

import type { DiscoverSkillListItemVo } from "@/shared/lib/zod/schemas/discover-skill";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ContentCard } from "@/shared/ui/content-card";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { SkillDescLang } from "../lib/desc-lang";

import { ReportSkillDialog } from "./report-skill-dialog";

type SkillCardProps = {
	skill: DiscoverSkillListItemVo;
	// 描述展示语言：中文优先 descriptionZh，缺译回落原文
	lang?: SkillDescLang;
	// 是否允许反馈（需登录）
	canReport?: boolean;
	// 本会话是否已反馈
	reported?: boolean;
	// 反馈成功后回写页面状态
	onReported?: (skillId: string) => void;
};

// # Skill 广场卡片：只读 ContentCard；视觉尺寸与收录共用 aspect-4/3
export function SkillCard({
	skill,
	lang = "zh",
	canReport = false,
	reported = false,
	onReported,
}: SkillCardProps): JSX.Element {
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

	// 描述偏长时给全文 Tooltip（不改卡片尺寸测量逻辑，避免自定义 preview 撑破比例）
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
			actions={
				<div className="flex w-full min-w-0 items-center justify-between gap-2">
					<span className="min-w-0 truncate text-muted-foreground text-xs">{sourceLabel}</span>
					<div className="flex shrink-0 items-center gap-1">
						<Badge variant="outline" className="max-w-24 truncate text-xs">
							{licenseLabel}
						</Badge>
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
					</div>
				</div>
			}
		/>
	);

	return (
		<>
			{/* // 网格单元内拉满宽度，保证与邻卡同宽同高（aspect 由 ContentCard 决定） */}
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
				<ReportSkillDialog
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
