"use client";

// # 导航面包屑：项目列表 / 项目 / 各层文件夹 /（阅读中的文档），末段为当前页不可点

import type { JSX } from "react";
import { Fragment } from "react";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import { agentsTreeItems, getPathIds } from "../../model/mock-tree";

interface BreadcrumbNavProps {
	/** 当前路径末端 id：卡片态为选中的文件夹，阅读态为文档 id */
	currentId: string;
	/** 点击"项目列表"段返回首页 */
	onNavigateHome: () => void;
	/** 点击中间的文件夹段，跳到该文件夹的卡片列表 */
	onNavigateFolder: (folderId: string) => void;
}

export function BreadcrumbNav({
	currentId,
	onNavigateHome,
	onNavigateFolder,
}: BreadcrumbNavProps): JSX.Element {
	const segments = buildPathSegments(currentId);
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

// 把路径型 id 拆成面包屑段，段名从树数据取
const buildPathSegments = (pathId: string): { id: string; name: string }[] =>
	getPathIds(pathId).map((id) => ({ id, name: agentsTreeItems[id]?.name ?? id }));
