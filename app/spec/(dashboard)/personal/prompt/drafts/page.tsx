import { PersonalDraftsPage } from "@/pages/spec/personal/prompt/drafts";
import { listDraftsDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";

// # 个人草稿页（薄层路由）

// > 搜索（q + filter）与文件夹来自 searchParams，透传给客户端组件由 SWR 拉取
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; filter?: string; folderId?: string }>;
}) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await 再校验
	const sp = await searchParams;
	// 用 Zod 校验：合法值保留，非法值校验失败直接抛错
	const { q, filter, folderId } = listDraftsDtoSchema.parse(sp);
	return <PersonalDraftsPage q={q?.trim() || undefined} filter={filter} folderId={folderId} />;
}
