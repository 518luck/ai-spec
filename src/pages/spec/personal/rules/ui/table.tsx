"use client";

// # 规约列表表格：展示规则名称、所属文件夹、标签及操作列

import type { JSX } from "react";
import { Badge } from "@/shared/ui/badge";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { TableActions } from "./table-actions";

// 规则数据类型
export type Rule = {
	id: string;
	name: string;
	folder: string;
	tags: string[];
};

// 规则样例数据：临时硬编码，后续接入 API
const rules: Rule[] = [
	{ id: "1", name: "使用函数组件", folder: "代码 / React", tags: ["组件"] },
	{ id: "2", name: "props 必须只读", folder: "代码 / React", tags: ["组件"] },
	{ id: "3", name: "Error 必须显式处理", folder: "代码 / Go", tags: ["error"] },
	{ id: "4", name: "避免 any 类型", folder: "代码 / TypeScript", tags: ["类型", "架构"] },
	{ id: "5", name: "悲愤情感用短句", folder: "创作 / 小说", tags: ["情感"] },
];

export function RuleTable(): JSX.Element {
	return (
		<div className="flex h-full flex-col overflow-hidden rounded-lg border">
			<ScrollArea orientation="horizontal" className="min-h-0 flex-1" scrollbarClassName="mx-4">
				<Table className="table-fixed" containerClassName="overflow-x-visible">
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead className="w-48 pl-4">名称</TableHead>
							<TableHead className="w-48">所属文件夹</TableHead>
							<TableHead>标签</TableHead>
							<TableHead className="w-16 pr-4">操作</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rules.map((rule) => (
							<TableRow key={rule.id}>
								<TableCell className="truncate pl-4 font-medium">{rule.name}</TableCell>
								<TableCell className="truncate text-muted-foreground">{rule.folder}</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{rule.tags.map((tag) => (
											<Badge key={tag} shape="square" variant="secondary">
												{tag}
											</Badge>
										))}
									</div>
								</TableCell>
								<TableCell className="pr-4">
									<TableActions rule={rule} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</ScrollArea>
		</div>
	);
}
