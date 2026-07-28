import { CreateRulePage } from "@/pages/spec/personal/rules";

// # 创建规约页（薄层路由）

// > 目标领域空间来自 searchParams，透传给客户端组件，决定新规约与文件夹下拉的空间归属
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ spaceId?: string }>;
}) {
	const { spaceId } = await searchParams;
	return <CreateRulePage spaceId={spaceId} />;
}
