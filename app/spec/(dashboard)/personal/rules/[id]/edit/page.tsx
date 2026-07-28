// # 编辑规约路由：从动态段取规约 id，委托给编辑页主组件（数据由客户端加载）

import { EditPage } from "@/pages/spec/personal/rules";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <EditPage id={id} />;
}
