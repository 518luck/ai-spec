"use client";

import { useSession } from "next-auth/react";
import type { JSX } from "react";
import useSWR from "swr";

import { getDrafts } from "@/entities/prompt";
import type { ListDraftsDto } from "@/shared/lib/zod/schemas/prompt/draft";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";
import { EmptyState } from "@/widgets/empty-state";
import { ToolbarPageShell } from "@/widgets/page-shell";
import { CreateDraftButton } from "./create-draft-button";
import { DraftFolderFilter } from "./draft-folder-filter";
import { DraftsGrid } from "./drafts-grid";

// # 个人草稿页：SWR 拉 GET /api/prompt/drafts，搜索/排序/文件夹变化自动重新请求
export function PersonalDraftsPage({ query, sort, folderId }: ListDraftsDto): JSX.Element {
	const { status } = useSession();

	// SWR key 含 query/sort/folderId，任一变化自动重拉；未登录时不发请求
	const { data, isLoading } = useSWR(
		status === "authenticated" ? (["drafts", query, sort, folderId] as const) : null,
		async ([, query, sort, folderId]) => getDrafts({ query, sort, folderId }),
	);

	const drafts = data?.data ?? [];
	const total = data?.total ?? 0;

	return (
		<ToolbarPageShell
			title="草稿"
			help={<HelpTooltip content="随手记录灵感，转正后进入收录库管理版本与标签" />}
			filter={<DraftFolderFilter />}
			// TODO: 后面需要做弹窗处理，用户没有登录的时候给一个登录引导
			actions={status === "authenticated" ? <CreateDraftButton /> : undefined}
		>
			{isLoading ? (
				<div className="flex justify-center py-20">
					<Spinner className="size-6" />
				</div>
			) : total === 0 ? (
				<EmptyState icon={Icons.prompt} description="还没有草稿，随手记下你的灵感吧" />
			) : (
				<DraftsGrid drafts={drafts} />
			)}
		</ToolbarPageShell>
	);
}
