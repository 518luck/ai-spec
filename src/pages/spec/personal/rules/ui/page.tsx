"use client";

// # 个人规约库页：规则列表表格，toolbar 含文件夹筛选，筛选条带含标签过滤 + 搜索

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { FolderCombobox } from "@/features/folder-combobox";
import { SearchInput } from "@/features/search-input";
import type { ListRulesDto } from "@/shared/lib/zod/schemas/rule";
import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/kbd";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { RuleTagFilter } from "./rule-tag-filter";
import { RuleTable } from "./table";

type PersonalRulesPageProps = ListRulesDto;

export function PersonalRulesPage({ folderId, tagIds, q }: PersonalRulesPageProps): JSX.Element {
	const router = useRouter();

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
				{/* // @ 筛选条带：标签过滤贴左、搜索框贴右；始终展示，避免切换筛选时组件卸载丢状态 */}
				<div className="mb-6 flex items-center justify-between gap-3">
					<RuleTagFilter />
					<SearchInput className="max-w-80" filters={["title", "content"]} defaultFilter="title" />
				</div>
				<RuleTable folderId={folderId} tagIds={tagIds} q={q} />
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
