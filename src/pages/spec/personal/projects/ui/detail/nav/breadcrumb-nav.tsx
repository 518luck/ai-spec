"use client";

// # 导航面包屑：项目列表 / 项目 / 各层文件夹 /（阅读中的文档），末段为当前页不可点

import type { JSX } from "react";
import { Fragment } from "react";

import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import type { ProjectTreeNode } from "../../../model/path-utils";
import { getPathIds } from "../../../model/path-utils";

interface BreadcrumbNavProps {
	/** 当前打开的项目 id */
	projectId: string;
	/** 项目内文件夹树（段名取自此处） */
	tree: Record<string, ProjectTreeNode>;
	/** 项目全部文档（文档段名取自此处） */
	agentsMds: AgentsMdListItemVo[];
	/** 当前路径末端 id：卡片态为选中的文件夹，阅读态为文档 id */
	currentId: string;
	/** 点击"项目列表"段返回首页 */
	onNavigateHome: () => void;
	/** 点击中间的文件夹段，跳到该文件夹的卡片列表 */
	onNavigateFolder: (folderId: string) => void;
}

export function BreadcrumbNav({
	projectId,
	tree,
	agentsMds,
	currentId,
	onNavigateHome,
	onNavigateFolder,
}: BreadcrumbNavProps): JSX.Element {
	const segments = buildPathSegments(projectId, tree, agentsMds, currentId);
	const lastIndex = segments.length - 1;

	return (
		<Breadcrumb className="flex h-11 shrink-0 items-center border-b px-4">
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink
						render={<button type="button" onClick={onNavigateHome} className="cursor-pointer" />}
					>
						项目列表
					</BreadcrumbLink>
				</BreadcrumbItem>
				{segments.map((segment, index) => (
					<Fragment key={segment.id}>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							{index === lastIndex ? (
								<BreadcrumbPage>{segment.name}</BreadcrumbPage>
							) : (
								<BreadcrumbLink
									render={
										<button
											type="button"
											onClick={() => onNavigateFolder(segment.id)}
											className="cursor-pointer"
										/>
									}
								>
									{segment.name}
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

// 把当前 id 拆成面包屑段：先放项目根，再放各层文件夹，最后放文档（阅读态）
const buildPathSegments = (
	projectId: string,
	tree: Record<string, ProjectTreeNode>,
	agentsMds: AgentsMdListItemVo[],
	currentId: string,
): { id: string; name: string }[] => {
	const segments: { id: string; name: string }[] = [
		// 第一段永远是项目根本身
		{ id: projectId, name: tree[projectId]?.name ?? projectId },
	];

	// currentId 是文档 id 时：从 agentsMds 反查 path，推导祖先文件夹
	const agentsMd = agentsMds.find((d) => d.id === currentId);
	if (agentsMd) {
		const folderSegments = agentsMd.path.split("/").slice(0, -1);
		// 累计前缀作为各层文件夹 id（与 buildProjectTree 的 id 生成规则一致）
		const folderIds = folderSegments.map((_, index) =>
			folderSegments.slice(0, index + 1).join("/"),
		);
		for (const [index, folderId] of folderIds.entries()) {
			segments.push({ id: folderId, name: tree[folderId]?.name ?? folderSegments[index] });
		}
		segments.push({ id: agentsMd.id, name: agentsMd.title });
		return segments;
	}

	// currentId 是文件夹 id 时：按路径前缀展开祖先（currentId 本身就是累计前缀路径）
	if (currentId !== projectId) {
		for (const ancestorId of getPathIds(currentId)) {
			segments.push({ id: ancestorId, name: tree[ancestorId]?.name ?? ancestorId });
		}
	}

	return segments;
};
