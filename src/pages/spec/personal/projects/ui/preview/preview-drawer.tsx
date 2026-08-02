"use client";

// # 项目预览抽屉：右侧宽抽屉，展示项目信息 + 配置清单 + AI 总结

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { type JSX, useRef } from "react";

import { FolderIcon } from "@/features/folder-combobox";
import { client } from "@/shared/lib/orpc/client";
import { projectKeys } from "@/shared/lib/orpc/query-keys";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { Separator } from "@/shared/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { AiSummary } from "./ai-summary";
import { PreviewAccordion } from "./preview-accordion";

interface ProjectPreviewDrawerProps {
	/** 当前打开的项目 id；null 表示关闭 */
	projectId: string | null;
	/** 抽屉开关回调，关闭时上层清空 projectId */
	onOpenChange: (open: boolean) => void;
}

// > 右侧抽屉：projectId 非空时打开；用 ref 缓存上一个 id，关闭动画期间继续展示内容
export function ProjectPreviewDrawer({
	projectId,
	onOpenChange,
}: ProjectPreviewDrawerProps): JSX.Element | null {
	// 缓存上一个有效 projectId：关闭动画期间 projectId 已变 null，但仍需展示内容
	const lastIdRef = useRef<string | null>(null);
	if (projectId) lastIdRef.current = projectId;
	const previewId = projectId ?? lastIdRef.current;

	// 从未打开过，不渲染 Sheet
	if (!previewId) return null;

	return (
		<Sheet open={Boolean(projectId)} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="gap-0 data-[side=right]:sm:max-w-180">
				<PreviewContent projectId={previewId} />
			</SheetContent>
		</Sheet>
	);
}

// 抽屉主体：独立组件以便 projectId 固定时 useQuery 的 queryKey 稳定
function PreviewContent({ projectId }: { projectId: string }): JSX.Element {
	// 项目详情：拿名称/简介/文件夹归属
	const { data: project, isLoading: projectLoading } = useQuery({
		queryKey: projectKeys.detail(projectId),
		queryFn: () => client.projects.getById({ id: projectId }),
	});
	// 项目配置列表：取全量供抽屉展示
	const { data: agentsMds } = useQuery({
		queryKey: projectKeys.agentsMds(projectId),
		queryFn: () => client.agentsMds.list({ projectId }),
	});
	// 项目文件夹：构建 id → 名称映射，配置行标注挂载位置
	const { data: projectFolders } = useQuery({
		queryKey: projectKeys.projectFolders(projectId),
		queryFn: () => client.projects.projectFolders.list({ projectId }),
	});
	const folderNames = Object.fromEntries(
		(projectFolders ?? []).map((folder) => [folder.id, folder.name]),
	);

	if (projectLoading || !project) {
		return (
			<div className="flex h-40 items-center justify-center">
				<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
			</div>
		);
	}

	return (
		<>
			<SheetHeader className="border-b p-6 pb-4">
				<SheetTitle className="font-heading text-lg">{project.name}</SheetTitle>
				<SheetDescription>{project.description}</SheetDescription>
				{project.folderName ? (
					<div className="mt-1 flex items-center gap-1.5">
						<FolderIcon
							color={project.folderColor ?? "#ef4444"}
							className="size-5 rounded"
							iconClassName="size-3"
						/>
						<span className="text-muted-foreground text-xs">{project.folderName}</span>
					</div>
				) : null}
				<Link
					href={`/spec/personal/projects/${projectId}`}
					className="text-muted-foreground text-xs hover:text-foreground"
				>
					进入项目 <Icons.folderOpen className="inline size-3" />
				</Link>
			</SheetHeader>
			<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
				<AiSummary projectId={projectId} />
				<Separator />
				<PreviewAccordion resources={[]} agentsMds={agentsMds ?? []} folderNames={folderNames} />
			</div>
		</>
	);
}
