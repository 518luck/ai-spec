import { PersonalDraftsPage } from "@/pages/spec/personal/prompt/drafts";

// # 个人草稿页（薄层路由）

// > 搜索与排序来自 searchParams，透传给服务端组件按条件查询
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ query?: string; sort?: string; folder?: string }>;
}) {
	const { query, sort, folder } = await searchParams;
	return <PersonalDraftsPage query={query?.trim() ?? ""} sort={sort ?? ""} folderId={folder} />;
}
