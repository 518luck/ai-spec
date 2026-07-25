"use client";

// # 个人规约库页：规则列表表格，toolbar 含文件夹筛选

import { useRouter, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { FolderCombobox } from "@/features/folder-combobox";
import { SearchInput } from "@/features/search-input";
import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/kbd";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { RuleTable } from "./table";

export function PersonalRulesPage(): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();
	const folderId = searchParams?.get("folderId") ?? undefined;
	const q = searchParams?.get("q") ?? undefined;

	// 跳转到创建规约页面
	const handleCreateRule = (): void => {
		router.push("/spec/personal/rules/create");
	};

	return (
		<ToolbarPageShell
			title="规约库"
			filter={<FolderCombobox resourceType="ruleFolder" />}
			actions={
				<Button size="sm" variant="outline" className="gap-2" onClick={handleCreateRule}>
					新增规约
					<Kbd alignWithText hideOnNarrow>
						C
					</Kbd>
				</Button>
			}
		>
			<PageWidthWrapper fill>
				{/* 筛选条带 */}
				<div className="mb-6 flex items-center justify-end gap-3">
					<SearchInput className="max-w-80" filters={["title", "content"]} defaultFilter="title" />
				</div>
				<RuleTable folderId={folderId} q={q} />
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
