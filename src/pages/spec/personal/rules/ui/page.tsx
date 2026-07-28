"use client";

// # 个人规约库页：规则列表表格，toolbar 含文件夹筛选，筛选条带含空间/标签过滤 + 搜索

import { useRouter, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { startTransition, useOptimistic } from "react";
import { Combobox as FolderCombobox } from "@/features/folder-combobox";
import { Combobox as RuleSpaceCombobox } from "@/features/rule-space-combobox";
import { Input as SearchInput } from "@/features/search-input";
import { HOTKEYS } from "@/shared/configs/hotkeys.config";
import { useHotkey } from "@/shared/hooks";
import type { ListRulesDto } from "@/shared/lib/zod/schemas/rule";
import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/kbd";
import { ToolbarPageShell, WidthWrapper } from "@/widgets/page-shell";
import { LayoutPopover } from "./layout-popover";
import { List } from "./list";
import { TagFilter } from "./tag-filter";
import { parseView, RULE_VIEW_PARAM, type RuleViewType, ViewToggle } from "./view-toggle";

type PersonalPageProps = ListRulesDto;

export function PersonalPage({ folderId, spaceId, tagIds, q }: PersonalPageProps): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();
	// ! 视图以 URL 为准，但 router.replace 要等一次 RSC 往返；用 useOptimistic 先本地翻页，导航落地后自动跟 URL 对齐，否则点按钮会明显卡一下
	const [view, setOptimisticView] = useOptimistic(parseView(searchParams?.get(RULE_VIEW_PARAM)));

	// 切换视图：先乐观翻页，再把参数写回 URL；默认的表格视图不写参数保持 URL 干净，其余筛选参数原样保留
	const handleViewChange = (next: RuleViewType): void => {
		startTransition(() => {
			setOptimisticView(next);
			const params = new URLSearchParams(searchParams?.toString() ?? "");
			if (next === "table") params.delete(RULE_VIEW_PARAM);
			else params.set(RULE_VIEW_PARAM, next);
			router.replace(`?${params.toString()}`, { scroll: false });
		});
	};

	// 跳转到创建规约页面：带上当前空间，新规约默认落在这个空间里
	const handleCreateRule = (): void => {
		router.push(`/spec/personal/rules/create${spaceId ? `?spaceId=${spaceId}` : ""}`);
	};

	// > C 键快速创建：跳转独立创建页，无弹窗态需要禁用，输入场景与模态抑制由 hook 内建
	useHotkey({ combo: HOTKEYS.createNew.combo, onTrigger: handleCreateRule });

	return (
		<ToolbarPageShell
			title="规约库"
			// 文件夹筛选跟随当前领域空间，只展示空间内分类
			filter={<FolderCombobox resourceType="rules" spaceId={spaceId} />}
			actions={
				<Button size="sm" variant="outline" className="gap-2" onClick={handleCreateRule}>
					新增规约
					<Kbd alignWithText hideOnNarrow>
						{HOTKEYS.createNew.label}
					</Kbd>
				</Button>
			}
		>
			<WidthWrapper fill>
				{/* // @ 筛选条带：空间 + 标签过滤贴左、视图切换 + 搜索框贴右；始终展示，避免切换筛选时组件卸载丢状态 */}
				<div className="mb-6 flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<RuleSpaceCombobox />
						<TagFilter />
					</div>
					<div className="flex items-center gap-2">
						<LayoutPopover />
						<ViewToggle value={view} onChange={handleViewChange} />
						<SearchInput
							className="max-w-80"
							filters={["title", "content"]}
							defaultFilter="title"
						/>
					</div>
				</div>
				<List folderId={folderId} spaceId={spaceId} tagIds={tagIds} q={q} view={view} />
			</WidthWrapper>
		</ToolbarPageShell>
	);
}
