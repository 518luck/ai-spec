import { ProjectDetailPage } from "@/pages/spec/personal/projects";

// # 个人项目详情页（薄层路由，projectId 来自 URL 参数）
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	// Next.js 15 的 params 是 Promise，必须先 await
	const { id } = await params;
	return <ProjectDetailPage projectId={id} />;
}
