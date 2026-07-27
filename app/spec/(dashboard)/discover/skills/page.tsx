import { DiscoverSkillsPage } from "@/pages/spec/discover/skills";
import { listDiscoverSkillsDtoSchema } from "@/shared/lib/zod/schemas/discover-skill";

// # Skills 广场页（薄层路由，搜索词来自 searchParams，透传给客户端组件由 SWR 拉取）
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await 再校验
	const { q } = await searchParams;
	const parsed = listDiscoverSkillsDtoSchema.parse({ q });
	return <DiscoverSkillsPage q={parsed.q} />;
}
