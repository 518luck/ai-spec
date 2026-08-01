"use client";

// # 项目卡片网格：首页按项目列出接入的仓库，整卡点击打开预览抽屉，hover 可进入完整页

import { useRouter } from "next/navigation";
import type { JSX } from "react";

import type { ProjectListItemVo } from "@/shared/lib/zod/schemas/project";
import { Button } from "@/shared/ui/button";
import { ContentCard } from "@/shared/ui/content-card";
import { Icons } from "@/shared/ui/icons";

interface ProjectCardGridProps {
	projects: ProjectListItemVo[];
	/** 点击卡片时上抛项目 id，由调用方决定打开抽屉或跳转 */
	onOpen: (projectId: string) => void;
}

export function ProjectCardGrid({ projects, onOpen }: ProjectCardGridProps): JSX.Element {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{projects.map((project) => (
				// 在 map 里用闭包绑定 id，Card 只接收无参 onOpen，不让 id 倒流
				<ProjectCard key={project.id} project={project} onOpen={() => onOpen(project.id)} />
			))}
		</div>
	);
}

interface ProjectCardProps {
	project: ProjectListItemVo;
	/** 卡片被点击时触发，id 由上层闭包绑定，本组件不感知 */
	onOpen: () => void;
}

// 单张项目卡：整卡点击打开预览抽屉；hover 出“进入完整页”快捷入口；底部展示文档计数
function ProjectCard({ project, onOpen }: ProjectCardProps): JSX.Element {
	const router = useRouter();
	return (
		<ContentCard
			name={project.name}
			preview={project.description || "暂无描述"}
			previewClassName="line-clamp-2"
			onClick={onOpen}
			clickAriaLabel="打开项目预览"
			className="aspect-auto h-36"
			actions={
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="进入完整页"
					onClick={() => router.push(`/spec/personal/projects/${project.id}`)}
				>
					<Icons.folderOpen className="size-4" />
				</Button>
			}
			footer={
				<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
					<Icons.agentsMd className="size-3.5 shrink-0" />
					{project.docCount} 篇文档
				</span>
			}
		/>
	);
}
