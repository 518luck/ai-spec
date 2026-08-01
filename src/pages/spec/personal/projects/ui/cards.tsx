"use client";

// # 项目卡片网格：首页按项目制列出接入的仓库，点击打开该项目的详情抽屉

import type { JSX } from "react";

import type { ProjectListItemVo } from "@/shared/lib/zod/schemas/project";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
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

// 单张项目卡：标题按钮的伪元素铺满卡面实现整卡可点，底部展示文档计数
// > AI 资源计数（skill/plugin/mcp/agent）暂未接入后端，统一占位"暂无 AI 资源"，等 git 同步能力上线后再做
function ProjectCard({ project, onOpen }: ProjectCardProps): JSX.Element {
	return (
		<Card size="sm" className="group relative transition hover:ring-foreground/25">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Icons.projects className="size-4 shrink-0 text-muted-foreground" />
					<button
						type="button"
						onClick={onOpen}
						className="min-w-0 cursor-pointer truncate outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
					>
						{project.name}
					</button>
				</CardTitle>
				<CardDescription className="line-clamp-2">{project.description}</CardDescription>
			</CardHeader>
			<CardFooter className="gap-1.5 text-muted-foreground text-xs">
				<Icons.agentsMd className="size-3.5 shrink-0" />
				<span>{project.docCount} 篇文档</span>
			</CardFooter>
		</Card>
	);
}
