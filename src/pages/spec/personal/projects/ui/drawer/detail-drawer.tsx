"use client";

// # 项目详情抽屉：右侧宽抽屉，展示资源清单 + 项目文档 + AI 总结

import Link from "next/link";
import { type JSX, useRef } from "react";

import { FolderIcon } from "@/features/folder-combobox";
import { Icons } from "@/shared/ui/icons";
import { Separator } from "@/shared/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { getFolder, getProjectDetail } from "../../model/mock-tree";
import { AiSummary } from "./ai-summary";
import { DetailAccordion } from "./detail-accordion";

interface ProjectDetailDrawerProps {
	/** 当前打开的项目 id；null 表示关闭 */
	projectId: string | null;
	/** 抽屉开关回调，关闭时上层清空 projectId */
	onOpenChange: (open: boolean) => void;
}

// > 右侧抽屉：projectId 非空时打开；用 ref 缓存上一个 id，关闭动画期间继续展示内容
export function ProjectDetailDrawer({
	projectId,
	onOpenChange,
}: ProjectDetailDrawerProps): JSX.Element | null {
	// 缓存上一个有效 projectId：关闭动画期间 projectId 已变 null，但仍需展示内容
	const lastIdRef = useRef<string | null>(null);
	if (projectId) lastIdRef.current = projectId;
	const detailId = projectId ?? lastIdRef.current;

	// 从未打开过，不渲染 Sheet
	if (!detailId) return null;

	const detail = getProjectDetail(detailId);
	const folder = getFolder(detail.folderId);

	return (
		<Sheet open={Boolean(projectId)} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="gap-0 data-[side=right]:sm:max-w-180">
				<SheetHeader className="border-b p-6 pb-4">
					<SheetTitle className="font-heading text-lg">{detail.name}</SheetTitle>
					<SheetDescription>{detail.description}</SheetDescription>
					{folder ? (
						<div className="mt-1 flex items-center gap-1.5">
							<FolderIcon color={folder.color} className="size-5 rounded" iconClassName="size-3" />
							<span className="text-muted-foreground text-xs">{folder.name}</span>
						</div>
					) : null}
					<Link
						href={`/spec/personal/projects/${detailId}`}
						className="text-muted-foreground text-xs hover:text-foreground"
					>
						在完整页面打开 <Icons.promote className="inline size-3" />
					</Link>
				</SheetHeader>
				<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
					<AiSummary projectId={detailId} />
					<Separator />
					<DetailAccordion resources={detail.resources} agentsDocs={detail.agentsDocs} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
