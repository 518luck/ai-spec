import { PersonalDraftsPage } from "@/pages/spec/personal/prompt/drafts";
import { listDraftsDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";

// # 个人草稿页（薄层路由）

// > 搜索与排序来自 searchParams，透传给客户端组件由 SWR 拉取
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ query?: string; sort?: string; folderId?: string }>;
}) {
	// 用 Zod 校验 searchParams：合法值保留，非法值丢弃（sort 非 created/updated 时变 undefined）
	const { query, sort, folderId } = listDraftsDtoSchema.parse(searchParams);
	return <PersonalDraftsPage query={query?.trim() || undefined} sort={sort} folderId={folderId} />;
}
