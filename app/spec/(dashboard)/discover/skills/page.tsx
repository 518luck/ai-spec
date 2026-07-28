import { cookies } from "next/headers";

import { DiscoverSkillsPage } from "@/pages/spec/discover/skills";
import { parseSkillDescLang } from "@/pages/spec/discover/skills/lib/desc-lang";
import { DISCOVER_SKILL_DESC_LANG_COOKIE } from "@/shared/lib/cookie/cookies";
import { listDiscoverSkillsDtoSchema } from "@/shared/lib/zod/schemas/discover-skill";

// # Skills 广场页（薄层路由，搜索 / 组织 / 热度门槛来自 searchParams，透传给客户端由 SWR 拉取）
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; orgs?: string; minStars?: string }>;
}) {
	// Next.js 15 的 searchParams 是 Promise，必须先 await 再校验
	const raw = await searchParams;
	const parsed = listDiscoverSkillsDtoSchema.parse({
		q: raw.q,
		orgs: raw.orgs,
		minStars: raw.minStars,
	});
	// 描述语言偏好：SSR 读 cookie，首屏与切换后一致，避免闪一下中文再变英文
	const cookieStore = await cookies();
	const initialDescLang = parseSkillDescLang(
		cookieStore.get(DISCOVER_SKILL_DESC_LANG_COOKIE)?.value,
	);
	return (
		<DiscoverSkillsPage
			q={parsed.q}
			orgs={parsed.orgs}
			minStars={parsed.minStars}
			initialDescLang={initialDescLang}
		/>
	);
}
