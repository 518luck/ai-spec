// # 版本历史路由：从动态段取收录 id，委托给版本页主组件（数据由客户端加载，实现点击即跳转）

import { RecordVersionsPage } from "@/pages/spec/personal/prompt/records/versions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <RecordVersionsPage recordId={id} />;
}
