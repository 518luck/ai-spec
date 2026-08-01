"use client";

// # 模板文件结构预览：下拉搜索选模板 + 缩放文件树展示文件编排

import { type JSX, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/shared/ui/command";
import { Icons } from "@/shared/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { PROJECT_TEMPLATES, type TemplateFileNode } from "./templates";

type TemplateTreePreviewProps = {
	// 当前选中的模板 key
	templateKey: string;
	// 模板切换回调
	onTemplateChange: (key: string) => void;
	// 项目名称：作为文件树根节点实时显示
	projectName: string;
};

export function TemplateTreePreview({
	templateKey,
	onTemplateChange,
	projectName,
}: TemplateTreePreviewProps): JSX.Element {
	const [open, setOpen] = useState(false);
	const template = PROJECT_TEMPLATES.find((t) => t.key === templateKey) ?? PROJECT_TEMPLATES[0];
	// 根节点显示项目名，未输入时回落占位
	const rootName = projectName.trim() || "my-project";

	return (
		<div className="flex flex-col gap-2">
			<span className="text-muted-foreground text-xs">选择模板</span>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="w-full justify-between font-normal"
						/>
					}
				>
					<span className="flex items-center gap-1.5 truncate">
						<Icons.folderClosed className="size-4 shrink-0 text-muted-foreground" />
						<span className="truncate">{template.name}</span>
					</span>
					<Icons.chevronDown
						className={cn("size-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")}
					/>
				</PopoverTrigger>
				<PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
					<Command>
						<CommandInput placeholder="搜索模板..." />
						<CommandList>
							<CommandEmpty>没有匹配的模板</CommandEmpty>
							<CommandGroup>
								{PROJECT_TEMPLATES.map((t) => (
									<CommandItem
										key={t.key}
										// value 含名称+描述+key，多关键词命中便于搜索
										value={`${t.name} ${t.desc} ${t.key}`}
										onSelect={() => {
											onTemplateChange(t.key);
											setOpen(false);
										}}
									>
										<Icons.folderClosed className="size-4 shrink-0 text-muted-foreground" />
										<div className="flex min-w-0 flex-col">
											<span className="truncate text-sm">{t.name}</span>
											<span className="truncate text-muted-foreground text-xs">{t.desc}</span>
										</div>
										<Icons.check
											className={cn(
												"ml-auto size-4 shrink-0",
												templateKey === t.key ? "opacity-100" : "opacity-0",
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			<span className="mt-1 text-muted-foreground text-xs">文件结构</span>
			{/* // > 缩放文件树：等宽字体 + 缩小字号 + 可滚动，模拟代码编辑器的文件资源管理器缩略预览 */}
			<div className="scrollbar-thin max-h-60 overflow-auto rounded-md border border-border/50 bg-background/60 p-2">
				<div className="font-mono text-xs leading-5">
					{/* 根节点：项目名（随输入实时更新） */}
					<div className="flex items-center gap-1 text-foreground">
						<Icons.folderOpen className="size-3.5 shrink-0 text-muted-foreground" />
						<span className="font-medium">{rootName}/</span>
					</div>
					{/* 模板文件编排：嵌套 border-l 模拟缩进引导线 */}
					<div className="border-border/30 border-l pl-2.5">
						{template.tree.map((node) => (
							<TreeBranch key={node.name} node={node} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

// 递归渲染树节点：文件夹含子节点时嵌套 border-l 形成缩进引导线
function TreeBranch({ node }: { node: TemplateFileNode }): JSX.Element {
	const isFolder = node.type === "folder";
	const hasChildren = node.children !== undefined && node.children.length > 0;

	return (
		<div>
			<div className="flex items-center gap-1 py-px">
				{isFolder ? (
					<Icons.folderClosed className="size-3.5 shrink-0 text-muted-foreground" />
				) : (
					<FileIcon name={node.name} />
				)}
				<span className={cn("truncate", isFolder ? "text-foreground/80" : "text-muted-foreground")}>
					{node.name}
					{isFolder ? "/" : ""}
				</span>
			</div>
			{hasChildren ? (
				<div className="border-border/30 border-l pl-2.5">
					{node.children?.map((child) => (
						<TreeBranch key={child.name} node={child} />
					))}
				</div>
			) : null}
		</div>
	);
}

// 按文件名选图标：AGENTS.md 用 AI 图标，代码文件用 code 图标，其余用文本文件图标
function FileIcon({ name }: { name: string }): JSX.Element {
	if (name === "AGENTS.md") {
		return <Icons.agentsMd className="size-3.5 shrink-0 text-muted-foreground" />;
	}
	if (/\.(ts|tsx|js|jsx|json)$/.test(name)) {
		return <Icons.code className="size-3.5 shrink-0 text-muted-foreground" />;
	}
	return <Icons.logs className="size-3.5 shrink-0 text-muted-foreground" />;
}
