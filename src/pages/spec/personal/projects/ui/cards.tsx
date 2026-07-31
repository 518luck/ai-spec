"use client";

// # 项目卡片网格：首页按项目制列出接入的仓库，点击打开该项目的详情抽屉

import type { JSX } from "react";

import { Badge } from "@/shared/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { type Icon, Icons } from "@/shared/ui/icons";
import type { ProjectEntry } from "../model/mock-tree";

interface ProjectCardGridProps {
	projects: ProjectEntry[];
	/** 点击卡片时上抛项目 id，由调用方决定打开抽屉或跳转 */
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

// 单张项目卡：标题按钮的伪元素铺满卡面实现整卡可点，底部资源徽章展示各类 AI 资源数量
function ProjectCard({ project, onOpen }: ProjectCardProps): JSX.Element {
	const badges = [
		{ key: "skill", icon: Icons.skills, count: project.resourceCount.skill },
		{ key: "plugin", icon: Icons.plugins, count: project.resourceCount.plugin },
		{ key: "mcp", icon: Icons.mcp, count: project.resourceCount.mcp },
		{ key: "agent", icon: Icons.aiAgents, count: project.resourceCount.agent },
	].filter((b) => b.count > 0);

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
			<CardFooter className="gap-1.5">
				{badges.length > 0 ? (
					badges.map((b) => <ResourceBadge key={b.key} icon={b.icon} count={b.count} />)
				) : (
					<span className="text-muted-foreground text-xs">暂无 AI 资源</span>
				)}
			</CardFooter>
		</Card>
	);
}

// 资源计数徽章：图标 + 数字，secondary 配色融入卡片底栏
function ResourceBadge({ icon: Icon, count }: { icon: Icon; count: number }): JSX.Element {
	return (
		<Badge variant="secondary" className="gap-1 text-xs">
			<Icon />
			{count}
		</Badge>
	);
}
