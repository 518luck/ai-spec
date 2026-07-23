import { PersonalRecordsPage } from "@/pages/spec/personal/prompt/records";
import { listRecordsDtoSchema } from "@/shared/lib/zod/schemas/prompt/record";

// # 个人收录页（薄层路由）

// > 文件夹 + 标签 + 搜索 + 收藏筛选 + 排序都来自 searchParams，透传给客户端组件由 SWR 拉取
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{
		folderId?: string;
		tagIds?: string;
		q?: string;
		filter?: string;
		favorite?: string;
		sort?: string;
		useRecordId?: string;
		useVersionId?: string;
	}>;
}) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await 再校验
	const sp = await searchParams;
	// 先取出「使用此版本」带回的两个参数（不参与列表查询校验），剩余字段交给 schema 校验
	const { useRecordId, useVersionId, ...listParams } = sp;
	const { folderId, tagIds, q, filter, favorite, sort } = listRecordsDtoSchema.parse(listParams);
	return (
		<PersonalRecordsPage
			folderId={folderId}
			tagIds={tagIds}
			q={q}
			filter={filter}
			favorite={favorite}
			sort={sort}
			useRecordId={useRecordId}
			useVersionId={useVersionId}
		/>
	);
}
