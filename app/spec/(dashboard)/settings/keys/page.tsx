import { KeysPage } from "@/pages/spec/settings/keys";

// 从 URL ?page=N 解析当前页码（1-based），非法或缺失回退到第 1 页；内部统一用 0-based
const parsePage = (raw: string | undefined): number => {
	const n = Number(raw);
	return Number.isFinite(n) && n > 1 ? n - 1 : 0;
};

// 接入 Key 管理页面路由；页码来自 searchParams，透传给服务端组件按页查询
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
	const { page: pageParam } = await searchParams;
	return <KeysPage page={parsePage(pageParam)} />;
}
