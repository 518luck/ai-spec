"use client";

// # 详情分组列表：资源（skill/plugin/mcp/agent）与文档（AGENTS.md）统一成手风琴分组

import type { JSX } from "react";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/shared/ui/accordion";
import { Badge } from "@/shared/ui/badge";
import { type Icon, Icons } from "@/shared/ui/icons";
import type { AgentsDocEntry, AiResourceItem, AiResourceType } from "../../model/mock-tree";

// 资源类型元数据：标签、图标，按固定顺序渲染
const RESOURCE_META: { type: AiResourceType; label: string; icon: Icon }[] = [
	{ type: "skill", label: "Skills", icon: Icons.skills },
	{ type: "plugin", label: "Plugins", icon: Icons.plugins },
	{ type: "mcp", label: "MCP", icon: Icons.mcp },
	{ type: "agent", label: "Agents", icon: Icons.aiAgents },
];

// 文本列：内容 + 样式，行的列布局由调用方决定
interface SectionCell {
	text: string;
	className: string;
}

// 手风琴行：若干文本列
interface SectionRow {
	id: string;
	cells: SectionCell[];
}

// 手风琴分组：标题、图标、若干行
interface Section {
	key: string;
	title: string;
	icon: Icon;
	rows: SectionRow[];
}

interface DetailAccordionProps {
	resources: AiResourceItem[];
	agentsDocs: AgentsDocEntry[];
}

// > 资源按四类分组 + 文档单组，统一成平级手风琴
export function DetailAccordion({ resources, agentsDocs }: DetailAccordionProps): JSX.Element {
	const sections: Section[] = [];

	for (const meta of RESOURCE_META) {
		const items = resources.filter((r) => r.type === meta.type);
		if (items.length === 0) continue;
		sections.push({
			key: meta.type,
			title: meta.label,
			icon: meta.icon,
			rows: items.map((item) => ({
				id: item.id,
				cells: [
					{ text: item.name, className: "w-20 shrink-0 font-mono text-sm" },
					{
						text: item.description,
						className: "min-w-0 flex-1 truncate text-muted-foreground text-sm",
					},
					...(item.source
						? [{ text: item.source, className: "shrink-0 text-muted-foreground text-xs" }]
						: []),
				],
			})),
		});
	}

	if (agentsDocs.length > 0) {
		sections.push({
			key: "agentsMd",
			title: "AGENTS.md",
			icon: Icons.agentsMd,
			rows: agentsDocs.map((agentsDoc) => ({
				id: agentsDoc.fileId,
				cells: [
					{ text: agentsDoc.title, className: "min-w-0 flex-1 truncate" },
					{
						text: agentsDoc.excerpt,
						className: "min-w-0 max-w-40 truncate text-muted-foreground text-xs",
					},
					{
						text: agentsDoc.folderPath,
						className: "shrink-0 font-mono text-muted-foreground text-xs",
					},
				],
			})),
		});
	}

	if (sections.length === 0) {
		return <div className="px-6 py-4 text-muted-foreground text-sm">该项目暂无内容</div>;
	}

	return (
		<Accordion multiple className="px-6 py-4">
			{sections.map((section) => (
				<AccordionItem key={section.key} value={section.key}>
					<AccordionTrigger className="gap-2">
						<section.icon className="size-4 shrink-0" />
						<span className="w-20 shrink-0 font-medium">{section.title}</span>
						<Badge variant="secondary" className="shrink-0">
							{section.rows.length}
						</Badge>
					</AccordionTrigger>
					<AccordionContent>
						{section.rows.map((row) => (
							<div key={row.id} className="flex items-center gap-2 py-1.5 text-sm">
								{row.cells.map((cell) => (
									<span key={cell.text} className={cell.className}>
										{cell.text}
									</span>
								))}
							</div>
						))}
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
}
