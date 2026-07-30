// # 规约详情路由：id 取规约，?edit=1 进编辑态，否则默认预览态

import { EditRulePage } from "@/pages/spec/personal/rules";

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ edit?: string }>;
}) {
	const { id } = await params;
	const { edit } = await searchParams;
	return <EditRulePage id={id} mode={edit === "1" ? "edit" : "view"} />;
}
