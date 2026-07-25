import { PersonalRulesPage } from "@/pages/spec/personal/rules";
import { listRulesDtoSchema } from "@/shared/lib/zod/schemas/rule";

// # 个人规约库页（薄层路由）

// > 文件夹 + 标签 + 搜索筛选都来自 searchParams，透传给客户端组件由 SWR 拉取
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{
		folderId?: string;
		tagIds?: string;
		q?: string;
	}>;
}) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await 再校验
	const sp = await searchParams;
	const { folderId, tagIds, q } = listRulesDtoSchema.parse(sp);
	return <PersonalRulesPage folderId={folderId} tagIds={tagIds} q={q} />;
}
