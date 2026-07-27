import { PersonalDraftsPage } from "@/pages/spec/personal/prompt/drafts";
import { listDraftsDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";

// # 个人草稿页（薄层路由）

// > 搜索（q + filter）与文件夹来自 searchParams，透传给客户端组件由 SWR 拉取
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; filter?: string; folderId?: string; create?: string }>;
}) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await 再校验
	const sp = await searchParams;
	// ! create 是快捷新建入口参数，只在客户端开弹窗用，不参与列表查询；DTO schema 开发环境走 strict，解析前必须摘掉
	const { create: _create, ...listParams } = sp;
	// 用 Zod 校验：合法值保留，非法值校验失败直接抛错
	const { q, filter, folderId } = listDraftsDtoSchema.parse(listParams);
	return <PersonalDraftsPage q={q?.trim() || undefined} filter={filter} folderId={folderId} />;
}
