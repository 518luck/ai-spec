import { ConfirmEmailChangePage } from "@/pages/spec/auth/confirm-email-change";

// 邮箱变更确认路由：从动态段取 token、从 query 取 cancel，委托给页面主组件
export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ token: string }>;
	searchParams: Promise<{ cancel?: string }>;
}) {
	const { token } = await params;
	const { cancel } = await searchParams;
	return <ConfirmEmailChangePage token={token} isCancel={cancel === "true"} />;
}
