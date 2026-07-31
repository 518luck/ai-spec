"use client";

// # 个人项目页：项目卡片网格，点击跳转到项目详情路由

import { useRouter } from "next/navigation";
import type { JSX } from "react";

import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { collectProjects } from "../model/mock-tree";
import { ProjectCardGrid } from "./project-cards";

// > 项目列表首屏：工具栏标题 + 新建按钮 + 项目卡片网格，点卡片跳转 /projects/[id]
export function PersonalProjectsPage(): JSX.Element {
	const router = useRouter();

	// 点击项目卡片跳转到项目详情页
	const handleOpen = (projectId: string): void => {
		router.push(`/spec/personal/projects/${projectId}`);
	};

	return (
		<ToolbarPageShell
			title="项目"
			actions={
				<Button size="sm" variant="outline" className="gap-2">
					<Icons.plus className="size-4" />
					新建项目
				</Button>
			}
		>
			<PageWidthWrapper>
				<ProjectCardGrid projects={collectProjects()} onOpen={handleOpen} />
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
