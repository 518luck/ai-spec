import { PersonalRulesPage } from "@/pages/spec/personal/rules";
import { listRulesDtoSchema } from "@/shared/lib/zod/schemas/rule";

// # 个人规约库页（薄层路由）

// > 文件夹 + 标签 + 搜索筛选都来自 searchParams，透传给客户端组件由 SWR 拉取
export default async function Page({
	searchParams,
}: {
		searchParams: Promise<{
			folderId?: string;
			spaceId?: string;
			tagIds?: string;
			q?: string;
			view?: string;
			page?: string;
			pageSize?: string;
		}>;
}) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await 再校验
	const sp = await searchParams;
		// ! view/page/pageSize 只影响前端渲染，不参与列表查询；DTO schema 开发环境走 strict，解析前必须摘掉，否则未知键直接抛
		const { view: _view, page: _page, pageSize: _pageSize, ...listParams } = sp;
	const { folderId, spaceId, tagIds, q } = listRulesDtoSchema.parse(listParams);
	return <PersonalRulesPage folderId={folderId} spaceId={spaceId} tagIds={tagIds} q={q} />;
}
