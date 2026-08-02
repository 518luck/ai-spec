"use client";

// # 导航面包屑：项目列表 / 项目 / 各层文件夹 /（阅读中的配置），末段为当前页不可点

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
import { getFolderAncestorIds } from "../../../model/path-utils";

interface BreadcrumbNavProps {
	/** 项目内文件夹树（段名取自此处） */
	tree: Record<string, ProjectTreeNode>;
	/** 项目全部配置（配置段名取自此处） */
	agentsMds: AgentsMdListItemVo[];
	/** 当前路径末端 id：卡片态为选中的文件夹，阅读态为配置 id */
	currentId: string;
	/** 点击"项目列表"段返回首页 */
	onNavigateHome: () => void;
	/** 点击中间的文件夹段，跳到该文件夹的卡片列表 */
	onNavigateFolder: (folderId: string) => void;
}

export function BreadcrumbNav({
	tree,
	agentsMds,
	currentId,
	onNavigateHome,
	onNavigateFolder,
}: BreadcrumbNavProps): JSX.Element {
	const segments = buildPathSegments(tree, agentsMds, currentId);
	const lastIndex = segments.length - 1;

	return (
		// 紧凑高度（h-7 ≈ VSCode 面包屑）：只占一行导航；自带高度不自带 border-b（分隔线由外层容器负责）
		// 覆盖 BreadcrumbList 的 flex-wrap 为 nowrap + min-w-max：路径超宽时不折行不压缩，交给外层容器横向滚动
		<Breadcrumb className="flex h-7 shrink-0 items-center text-xs">
			<BreadcrumbList className="min-w-max flex-nowrap">
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

// 把当前 id 拆成面包屑段：文件夹态走父链（含项目根文件夹），阅读态在其后追加配置段
const buildPathSegments = (
	tree: Record<string, ProjectTreeNode>,
	agentsMds: AgentsMdListItemVo[],
	currentId: string,
): { id: string; name: string }[] => {
	// currentId 是配置 id 时：取它第一个挂载文件夹的父链，再追加配置段
	const agentsMd = agentsMds.find((d) => d.id === currentId);
	if (agentsMd) {
		const firstFolderId = agentsMd.folderIds[0];
		const segments = (firstFolderId ? getFolderAncestorIds(firstFolderId, tree) : []).map(
			(folderId) => ({ id: folderId, name: tree[folderId]?.name ?? folderId }),
		);
		segments.push({ id: agentsMd.id, name: agentsMd.name });
		return segments;
	}

	// currentId 是文件夹 id 时：父链含自身，天然以项目根文件夹开头
	return getFolderAncestorIds(currentId, tree).map((folderId) => ({
		id: folderId,
		name: tree[folderId]?.name ?? folderId,
	}));
};
