"use client";

import { type JSX, type ReactNode, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { FolderCombobox, type FolderOption } from "@/widgets/folder-combobox";
import { PageWidthWrapper } from "./page-width-wrapper";

// TODO: 临时 mock 数据，测完 FolderCombobox 效果后删除
const MOCK_FOLDERS: FolderOption[] = [
	{ value: "1", label: "React 精华", icon: "⚛️" },
	{ value: "2", label: "常用工具", icon: "🛠️" },
	{ value: "3", label: "学习笔记", icon: "📚" },
	{ value: "4", label: "AI 提示词", icon: "🤖" },
	{ value: "5", label: "未分类" },
];

type ToolbarPageShellProps = {
	title: ReactNode; // 页面标题，可传字符串或带图标的 ReactNode
	help?: ReactNode; // 标题旁的提示内容，由父组件决定渲染什么
	filter?: ReactNode; // 标题区的筛选器，如文件夹选择下拉
	actions?: ReactNode; // 右上角操作区，如"新建"按钮
	children: ReactNode; // 内容区
	className?: string; // 透传给最外层 div 的 className
};

// 带标题栏与右侧操作区的页面外壳，内容区可滚动
export function ToolbarPageShell({
	title,
	help,
	filter,
	actions,
	children,
	className,
}: ToolbarPageShellProps): JSX.Element {
	// TODO: 临时 state，测完 FolderCombobox 效果后连同 mock 数据一起删除
	const [folderId, setFolderId] = useState<string | undefined>(undefined);

	return (
		<div data-slot="toolbar-page-shell" className={cn("flex h-full min-h-0 flex-col", className)}>
			{/* 标题栏：左侧标题区（标题+提示+筛选器） + 右侧操作区 */}
			<div className="flex h-16 shrink-0 items-center border-b px-6">
				{typeof title === "string" ? (
					<div className="flex items-center gap-1.5">
						<h1 className="font-semibold text-lg leading-tight">{title}</h1>
						{help}
						{/* TODO: 临时硬编 FolderCombobox 看效果，测完改回 {filter} */}
						<FolderCombobox
							options={MOCK_FOLDERS}
							value={folderId}
							onChange={setFolderId}
							onCreate={async (name) => {
								console.log("创建文件夹:", name);
								return { value: Date.now().toString(), label: name };
							}}
							className="w-48"
						/>
					</div>
				) : (
					title
				)}
				{actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
			</div>

			{/* 内容区：可滚动，由 PageWidthWrapper 限制最大宽度并居中 */}
			<PageWidthWrapper border={false}>{children}</PageWidthWrapper>
		</div>
	);
}
