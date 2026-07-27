import type { JSX } from "react";

import type { DiscoverSkillListItemVo } from "@/shared/lib/zod/schemas/discover-skill";
import { Badge } from "@/shared/ui/badge";
import { Icons } from "@/shared/ui/icons";

type SkillCardProps = {
	skill: DiscoverSkillListItemVo;
};

// # Skill 广场卡片：名称 + star 数 + 描述 + 来源署名与回链
export function SkillCard({ skill }: SkillCardProps): JSX.Element {
	const { name, description, license, sourceRepo, sourceUrl, authorName, stars } = skill;

	return (
		<div className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-ring/40">
			<div className="flex items-start justify-between gap-2">
				<h3 className="truncate font-semibold text-sm">{name}</h3>
				<span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
					<Icons.star className="size-3.5" />
					{formatStars(stars)}
				</span>
			</div>
			<p className="line-clamp-3 flex-1 text-muted-foreground text-xs">{description}</p>
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
		</div>
	);
}

// star 数缩写：1240 → "1.2k"，避免长数字撑破卡片
const formatStars = (stars: number): string =>
	stars >= 1000 ? `${(stars / 1000).toFixed(stars >= 10_000 ? 0 : 1)}k` : String(stars);
