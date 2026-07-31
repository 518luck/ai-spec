"use client";

// # 项目卡片网格：首页按项目制列出接入的仓库，点击进入该项目的文件夹视图

import type { JSX } from "react";

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Icons } from "@/shared/ui/icons";
import type { ProjectEntry } from "../model/mock-tree";

interface ProjectCardGridProps {
	projects: ProjectEntry[];
	/** 点击卡片时上抛项目 id，进入该项目的文件夹视图 */
	onOpen: (projectId: string) => void;
}

export function ProjectCardGrid({ projects, onOpen }: ProjectCardGridProps): JSX.Element {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{projects.map((project) => (
				<ProjectCard key={project.projectId} project={project} onOpen={onOpen} />
			))}
		</div>
	);
}

interface ProjectCardProps {
	project: ProjectEntry;
	onOpen: (projectId: string) => void;
}

// 单张项目卡：标题按钮的伪元素铺满卡面实现整卡可点，底部资源徽章展示 AGENTS.md 数量
function ProjectCard({ project, onOpen }: ProjectCardProps): JSX.Element {
	return (
		<Card size="sm" className="group relative transition hover:ring-foreground/25">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Icons.projects className="size-4 shrink-0 text-muted-foreground" />
					<button
						type="button"
						onClick={() => onOpen(project.projectId)}
						className="min-w-0 cursor-pointer truncate outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
					>
						{project.name}
					</button>
				</CardTitle>
				<CardDescription className="line-clamp-2">{project.description}</CardDescription>
			</CardHeader>
			<CardFooter className="gap-1.5 text-muted-foreground text-xs">
				<Icons.agentsMd className="size-3.5 shrink-0" />
				<span>{project.docCount} 份 AGENTS.md</span>
			</CardFooter>
		</Card>
	);
}
