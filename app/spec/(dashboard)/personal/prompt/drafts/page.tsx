import { PersonalDraftsPage } from "@/pages/spec/personal/prompt/drafts";

// 接入个人草稿页面路由；搜索与排序来自 searchParams，透传给服务端组件按条件查询
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ query?: string; sort?: string }>;
}) {
	const { query, sort } = await searchParams;
	return <PersonalDraftsPage query={query?.trim() ?? ""} sort={sort ?? ""} />;
}
