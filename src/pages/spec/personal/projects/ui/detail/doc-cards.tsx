"use client";

// # AGENTS.md 文档卡片网格：每张卡对应一份文档，标出它所在的文件夹层级，点击进入阅读

import type { JSX } from "react";

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Icons } from "@/shared/ui/icons";
import type { AgentsDocEntry } from "../../model/mock-tree";

interface DocCardGridProps {
	docs: AgentsDocEntry[];
	/** 点击卡片时上抛文档 id，右侧切换为阅读视图 */
	onOpen: (fileId: string) => void;
}

export function DocCardGrid({ docs, onOpen }: DocCardGridProps): JSX.Element {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{docs.map((doc) => (
				<DocCard key={doc.fileId} doc={doc} onOpen={onOpen} />
			))}
		</div>
	);
}

interface DocCardProps {
	doc: AgentsDocEntry;
	onOpen: (fileId: string) => void;
}

// 单张卡片：标题按钮的伪元素铺满卡面实现整卡可点，底部标注文档所在文件夹路径
function DocCard({ doc, onOpen }: DocCardProps): JSX.Element {
	return (
		<Card size="sm" className="relative transition hover:ring-foreground/25">
			<CardHeader>
				<CardTitle>
					<button
						type="button"
						onClick={() => onOpen(doc.fileId)}
						className="cursor-pointer outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
					>
						{doc.title}
					</button>
				</CardTitle>
				<CardDescription className="line-clamp-2">{doc.excerpt}</CardDescription>
			</CardHeader>
			<CardFooter className="gap-1.5 text-muted-foreground text-xs">
				<Icons.folderClosed className="size-3.5 shrink-0" />
				<span className="truncate font-mono">{doc.folderPath}</span>
			</CardFooter>
		</Card>
	);
}
