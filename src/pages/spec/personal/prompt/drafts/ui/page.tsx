import type { JSX } from "react";

import prisma from "@/shared/db";
import { auth } from "@/shared/lib/auth/auth";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { ToolbarPageShell } from "@/widgets/page-shell";
import { DEFAULT_SORT, PAGE_SIZE } from "../config/draft-list";
import { CreateDraftButton } from "./create-draft-button";
import { type DraftItem, DraftsEmptyState, DraftsGrid } from "./drafts-grid";

// 草稿列表页参数，由路由层从 searchParams 解析后传入
type PersonalDraftsPageProps = {
	// 搜索关键词，模糊匹配 name/content
	query: string;
	// 排序值，对应 SORT_OPTIONS 的 value
	sort: string;
};

// 渲染个人草稿页面，按搜索/排序查询当前用户的草稿（服务端分页）
export async function PersonalDraftsPage({
	query,
	sort,
}: PersonalDraftsPageProps): Promise<JSX.Element> {
	const session = await auth();
	const userId = session?.user.id;

	// 已登录才查数据库；未登录时 drafts 为空，直接走空状态分支
	const { drafts, total } = userId
		? await loadDrafts(userId, query, sort)
		: { drafts: [] as DraftItem[], total: 0 };

	return (
		<ToolbarPageShell
			title="草稿"
			help={<HelpTooltip content="随手记录灵感，转正后进入收录库管理版本与标签" />}
			// TODO: 后面需要做弹窗处理，用户没有登录的时候给一个登录引导
			actions={userId ? <CreateDraftButton /> : undefined}
		>
			{total === 0 ? <DraftsEmptyState /> : <DraftsGrid drafts={drafts} />}
		</ToolbarPageShell>
	);
}

// 按搜索/排序查询当前用户的草稿，返回当前页切片与总数
async function loadDrafts(
	userId: string,
	query: string,
	sort: string,
): Promise<{ drafts: DraftItem[]; total: number }> {
	// 搜索条件：name 或 content 模糊匹配，不区分大小写（兼容英文关键词如 React/react）
	const where = query.trim()
		? {
				owner_id: userId,
				OR: [
					{ name: { contains: query, mode: "insensitive" as const } },
					{ content: { contains: query, mode: "insensitive" as const } },
				],
			}
		: { owner_id: userId };

	// 排序映射：updated→按更新时间倒序，created→按创建时间倒序
	const orderBy =
		sort === "created" ? { created_at: "desc" as const } : { updated_at: "desc" as const };

	// findMany 取当前页草稿，count 取总数；两者无依赖，并行查询
	const [rows, total] = await Promise.all([
		prisma.promptDraft.findMany({
			where,
			orderBy,
			take: PAGE_SIZE,
			select: {
				id: true,
				name: true,
				content: true,
				updated_at: true,
			},
		}),
		prisma.promptDraft.count({ where }),
	]);

	// 序列化为可安全传递给客户端组件的格式
	const drafts: DraftItem[] = rows.map((row) => ({
		id: row.id,
		name: row.name,
		content: row.content,
		updated_at: row.updated_at,
	}));

	return { drafts, total };
}
