import { PersonalRecordsPage } from "@/pages/spec/personal/prompt/records";
import { listRecordsDtoSchema } from "@/shared/lib/zod/schemas/prompt/record";

// # 个人收录页（薄层路由）

// > 文件夹筛选来自 searchParams，透传给客户端组件由 SWR 拉取
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ folderId?: string }>;
}) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await 再校验
	const sp = await searchParams;
	// 用 Zod 校验：合法值保留，非法值校验失败直接抛错
	const { folderId } = listRecordsDtoSchema.parse(sp);
	return <PersonalRecordsPage folderId={folderId} />;
}
