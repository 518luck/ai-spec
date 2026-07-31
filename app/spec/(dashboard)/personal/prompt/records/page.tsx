import { PersonalRecordsPage } from "@/pages/spec/personal/prompt/records";
import { RecordSchemas } from "@/shared/lib/zod/schemas/prompt/record";

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
		create?: string;
	}>;
}) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await 再校验
	const sp = await searchParams;
	// ! 「使用此版本」两参数与快捷新建的 create 不参与列表查询；DTO schema 开发环境走 strict，解析前必须摘掉，否则未知键直接抛
	const { useRecordId, useVersionId, create: _create, ...listParams } = sp;
	const { folderId, tagIds, q, filter, favorite, sort } = RecordSchemas.listDto.parse(listParams);
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
