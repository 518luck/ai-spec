"use client";

// # 规约列表表格：展示规则名称、预览及操作列

import type { JSX } from "react";
import useSWR from "swr";

import { getRules } from "@/entities/rule";
import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { TableActions } from "./table-actions";

export function RuleTable(): JSX.Element {
	// 获取规约列表
	const { data, isLoading } = useSWR("rules", () => getRules());

	if (isLoading) {
		return (
			<div className="flex h-60 items-center justify-center">
				<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
			</div>
		);
	}

	const rules = data?.data ?? [];

	if (rules.length === 0) {
		return (
			<div className="flex h-60 items-center justify-center text-muted-foreground">
				暂无规约，点击右上角"新增规约"创建
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-hidden rounded-lg border">
			<ScrollArea orientation="horizontal" className="min-h-0 flex-1" scrollbarClassName="mx-4">
				<Table className="table-fixed" containerClassName="overflow-x-visible">
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead className="w-48 pl-4">名称</TableHead>
							<TableHead>预览</TableHead>
							<TableHead className="w-16 pr-4">操作</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rules.map((rule) => (
							<TableRow key={rule.id}>
								<TableCell className="truncate pl-4 font-medium">{rule.name}</TableCell>
								<TableCell className="truncate text-muted-foreground">{rule.preview}</TableCell>
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
