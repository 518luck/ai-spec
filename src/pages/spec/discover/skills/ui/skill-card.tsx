"use client";

// # Skill 广场卡片：名称 + star + 描述 + 署名；支持反馈（收集-only）

import { type JSX, useLayoutEffect, useRef, useState } from "react";

import type { DiscoverSkillListItemVo } from "@/shared/lib/zod/schemas/discover-skill";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { SkillDescLang } from "../lib/desc-lang";

import { ReportSkillDialog } from "./report-skill-dialog";

type SkillCardProps = {
	skill: DiscoverSkillListItemVo;
	// 描述展示语言：中文优先 descriptionZh，缺译回落原文
	lang?: SkillDescLang;
	// 是否允许反馈（需登录）；未登录不展示按钮
	canReport?: boolean;
	// 本会话是否已反馈（由页面 Set 驱动）
	reported?: boolean;
	// 反馈成功后回写页面状态
	onReported?: (skillId: string) => void;
};

// # Skill 广场卡片：名称 + star 数 + 描述 + 来源署名与回链 + 反馈
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
	// 中文态：有译用译，无译回落原文；英文态始终原文
	const displayDescription = lang === "zh" ? descriptionZh?.trim() || description : description;
	// license 始终展示：有 SPDX 用原值，无协议标明「无协议」
	const licenseLabel = license?.trim() || "无协议";
	// 回链优先 sourceUrl，缺省时用 sourceRepo 拼仓库主页
	const repoHref = sourceUrl ?? (sourceRepo ? `https://github.com/${sourceRepo}` : null);

	const descRef = useRef<HTMLParagraphElement>(null);
	// 描述是否被 line-clamp 截断；仅截断时才挂 Tooltip
	const [truncated, setTruncated] = useState(false);
	const [reportOpen, setReportOpen] = useState(false);

	// 文案或语言变化后测量是否超出 3 行（依赖文案本身，不读 ref 身份）
	// biome-ignore lint/correctness/useExhaustiveDependencies: displayDescription 是测量触发信号，body 只读 DOM 几何
	useLayoutEffect(() => {
		const el = descRef.current;
		if (!el) return;
		setTruncated(el.scrollHeight > el.clientHeight + 1);
	}, [displayDescription]);

	// 反馈按钮：已反馈禁用；未反馈打开弹窗
	const reportButton = canReport ? (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			disabled={reported}
			aria-label={reported ? "已反馈" : "反馈此 Skill"}
			title={reported ? "已反馈" : "反馈"}
			className="text-muted-foreground hover:text-foreground"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				if (!reported) setReportOpen(true);
			}}
		>
			<Icons.flag className="size-3.5" />
		</Button>
	) : null;

	const cardBody = (
		<>
			<div className="flex items-start justify-between gap-2">
				<h3 className="truncate font-semibold text-sm">{name}</h3>
				<div className="flex shrink-0 items-center gap-0.5">
					{/* // 反馈：桌面 hover 显现，触控设备常显；已反馈仍可见但禁用 */}
					{reportButton ? (
						<span className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
							{reportButton}
						</span>
					) : null}

					<span className="flex items-center gap-1 text-muted-foreground text-xs">
						<Icons.star className="size-3.5" />
						{formatStars(stars)}
					</span>
				</div>
			</div>
			<p ref={descRef} className="line-clamp-3 flex-1 text-muted-foreground text-xs">
				{displayDescription}
			</p>
			{/* // @ 底部署名条：来源仓库 + license（含无协议）+ GitHub 回链，二者始终展示 */}
			<div className="flex items-center justify-between gap-2 pt-1">
				<span className="truncate text-muted-foreground text-xs">{sourceRepo ?? authorName}</span>
				<div className="flex shrink-0 items-center gap-1.5">
					<Badge variant="outline" className="max-w-28 truncate text-xs">
						{licenseLabel}
					</Badge>
					{repoHref ? (
						<a
							href={repoHref}
							target="_blank"
							rel="noreferrer"
							aria-label="在 GitHub 查看源仓库"
							className="text-muted-foreground transition-colors hover:text-foreground"
							onClick={(e) => e.stopPropagation()}
						>
							<Icons.github className="size-4" />
						</a>
					) : null}
				</div>
			</div>
		</>
	);

	const cardClassName =
		"group relative flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-ring/40";

	// 未截断：不包 Tooltip，避免短描述也弹层
	const card = !truncated ? (
		<div className={cardClassName}>{cardBody}</div>
	) : (
		// 截断：hover 卡片任意位置展示完整描述
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

	return (
		<>
			{card}
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

// star 数缩写：1240 → "1.2k"，避免长数字撑破卡片
const formatStars = (stars: number): string =>
	stars >= 1000 ? `${(stars / 1000).toFixed(stars >= 10_000 ? 0 : 1)}k` : String(stars);
