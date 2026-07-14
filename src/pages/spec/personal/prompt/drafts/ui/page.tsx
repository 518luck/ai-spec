"use client";

import { useSession } from "next-auth/react";
import type { JSX } from "react";
import useSWR from "swr";

import { getDrafts } from "@/entities/prompt";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";
import { EmptyState } from "@/widgets/empty-state";
import { ToolbarPageShell } from "@/widgets/page-shell";
import { CreateDraftButton } from "./create-draft-button";
import { DraftFolderFilter } from "./draft-folder-filter";
import { type DraftItem, DraftsGrid } from "./drafts-grid";

// 草稿列表页参数，由路由层从 searchParams 解析后传入
type PersonalDraftsPageProps = {
	// 搜索关键词，模糊匹配 name/content
	query: string;
	// 排序值，对应 SORT_OPTIONS 的 value
	sort: string;
	// 文件夹 ID（从 URL ?folder=xxx 解析），按文件夹筛选草稿
	folderId?: string;
};

// # 个人草稿页：SWR 拉 GET /api/prompt/drafts，搜索/排序/文件夹变化自动重新请求
export function PersonalDraftsPage({
	query,
	sort,
	folderId,
}: PersonalDraftsPageProps): JSX.Element {
	const { status } = useSession();

	// SWR key 含 query/sort/folderId，任一变化自动重拉；未登录时不发请求
	const { data, isLoading } = useSWR(
		status === "authenticated" ? ["drafts", query, sort, folderId] : null,
		([, q, s, f]: readonly [string, string, string, string | undefined]) =>
			getDrafts({ query: q, sort: s, folder: f }),
	);

	const drafts = (data?.data ?? []) as DraftItem[];
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
