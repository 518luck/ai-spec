"use client";

// # 模板文件结构预览：按模板 key 渲染文件树

import type { JSX } from "react";
import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
import { PROJECT_TEMPLATES, type TemplateFileNode } from "./templates";

type TemplateTreeProps = {
	templateKey: string;
	projectName: string;
};

// > 模板文件树：根节点显示项目名，嵌套 border-l 形成缩进引导线
export function TemplateTree({ templateKey, projectName }: TemplateTreeProps): JSX.Element {
	const template = PROJECT_TEMPLATES.find((t) => t.key === templateKey) ?? PROJECT_TEMPLATES[0];
	const rootName = projectName.trim() || "my-project";

	return (
		<div className="scrollbar-thin max-h-60 overflow-auto rounded-md border p-2">
			<div className="font-mono text-xs leading-5">
				<div className="flex items-center gap-1 text-foreground">
					<Icons.folderOpen className="size-3.5 shrink-0 text-muted-foreground" />
					<span className="font-medium">{rootName}/</span>
				</div>
				<div className="border-border/30 border-l pl-2.5">
					{template.tree.map((node) => (
						<TreeBranch key={node.name} node={node} />
					))}
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
