import { PersonalProjectsPage } from "@/pages/spec/personal/projects";
import { decodeFilters } from "@/shared/lib/search-filter-codec";

// # 个人项目列表页（薄层路由）

// > 搜索（q + filter）来自 searchParams，由 SearchInput 写入 URL；filter 解码后透传给客户端做本地过滤
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; filter?: string }>;
}) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await
	const sp = await searchParams;
	// filter 缺省时默认只搜标题，对齐 SearchInput 的 defaultFilter="title"
	const filter = decodeFilters(sp.filter) ?? { title: true };
	return <PersonalProjectsPage q={sp.q?.trim() || undefined} filter={filter} />;
}
