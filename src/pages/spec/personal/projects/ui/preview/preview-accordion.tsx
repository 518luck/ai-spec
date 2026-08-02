"use client";

// # 预览分组列表：资源（skill/plugin/mcp/agent）与配置（AGENTS.md）统一成手风琴分组

import type { JSX } from "react";

import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/shared/ui/accordion";
import { Badge } from "@/shared/ui/badge";
import { type Icon, Icons } from "@/shared/ui/icons";

// AI 资源类型枚举：项目收录的 skill / 插件 / MCP / agent 等条目（暂未接入后端，调用方传空数组）
type AiResourceType = "skill" | "plugin" | "mcp" | "agent";

// 单条 AI 资源
interface AiResourceItem {
	id: string;
	name: string;
	type: AiResourceType;
	description: string;
	source?: string;
}

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

interface PreviewAccordionProps {
	resources: AiResourceItem[];
	agentsMds: AgentsMdListItemVo[];
	/** 文件夹 id → 名称映射（配置行标注挂载位置用） */
	folderNames: Record<string, string>;
}

// > 资源按四类分组 + 配置单组，统一成平级手风琴
export function PreviewAccordion({
	resources,
	agentsMds,
	folderNames,
}: PreviewAccordionProps): JSX.Element {
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

	if (agentsMds.length > 0) {
		sections.push({
			key: "agentsMd",
			title: "AGENTS.md",
			icon: Icons.agentsMd,
			rows: agentsMds.map((agentsMd) => {
				// 挂载的文件夹名取第一个挂载点（多对多时只标注一个位置）
				const folderName = agentsMd.folderIds
					.map((folderId) => folderNames[folderId])
					.filter(Boolean)[0];
				return {
					id: agentsMd.id,
					cells: [
						{ text: agentsMd.name, className: "min-w-0 flex-1 truncate" },
						{
							text: agentsMd.excerpt,
							className: "min-w-0 max-w-40 truncate text-muted-foreground text-xs",
						},
						{
							text: folderName ?? "项目根",
							className: "shrink-0 font-mono text-muted-foreground text-xs",
						},
					],
				};
			}),
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
