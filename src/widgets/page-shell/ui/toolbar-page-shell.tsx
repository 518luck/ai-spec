"use client";

// # 带工具栏的页面外壳：标题栏（标题+提示+筛选器）+ 右侧操作区 + 可滚动内容区

import { type JSX, type ReactNode, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { FolderCombobox, type FolderOption } from "@/widgets/folder-combobox";
import { PageWidthWrapper } from "./page-width-wrapper";

// ? TODO 临时 mock 数据：测完 FolderCombobox 效果后删除
const MOCK_FOLDERS: FolderOption[] = [
	{ value: "1", label: "React 精华", color: "#61dafb" },
	{ value: "2", label: "常用工具", color: "#f59e0b" },
	{ value: "3", label: "学习笔记", color: "#10b981" },
	{ value: "4", label: "AI 提示词", color: "#8b5cf6" },
	// 超长名：考验触发按钮和下拉项的截断
	{
		value: "5",
		label: "这是一个超级无敌长的文件夹名称用来测试文字截断效果到底怎么样 hopefully it truncates",
		color: "#ef4444",
	},
	// 首尾空格 + 内部连续空格：考验 trim 和间距渲染
	{ value: "6", label: "   前 后   都  有 空格   ", color: "#06b6d4" },
	// emoji + 混排：考验字宽和对齐
	{ value: "7", label: "🚀发射基地 Alpha-1", color: "#f97316" },
	// 全角字符：中英混排宽度差异
	{ value: "8", label: "全角符号【】《》test", color: "#84cc16" },
	// 纯数字：无语义内容
	{ value: "9", label: "1234567890", color: "#0ea5e9" },
	// 无 color：考验默认灰底 fallback
	{ value: "10", label: "无颜色标签", color: undefined },
	// 特殊符号：引号、尖括号、反斜杠（防注入 / 渲染异常）
	{ value: "11", label: `含"引号"和<尖括号>及\\反斜杠`, color: "#ec4899" },
	// 单字符：极端短
	{ value: "12", label: "A", color: "#8b5cf6" },
];

type ToolbarPageShellProps = {
	title: ReactNode; // 页面标题，可传字符串或带图标的 ReactNode
	help?: ReactNode; // 标题旁的提示内容，由父组件决定渲染什么
	filter?: ReactNode; // 标题区的筛选器，如文件夹选择下拉
	actions?: ReactNode; // 右上角操作区，如"新建"按钮
	children: ReactNode; // 内容区
	className?: string; // 透传给最外层 div 的 className
};

export function ToolbarPageShell({
	title,
	help,
	filter,
	actions,
	children,
	className,
}: ToolbarPageShellProps): JSX.Element {
	// ? TODO 临时 state：测完 FolderCombobox 效果后连同 mock 数据一起删除
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
