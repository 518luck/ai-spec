import { auth } from "@/shared/lib/auth/auth";
import { RequireLoginDialog } from "@/shared/ui/require-login-dialog";

// 团队空间路由组鉴权：未登录不渲染子页面，弹出登录提示
export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactNode> {
  const session = await auth();

  if (!session?.user?.id) {
    return <RequireLoginDialog />;
  }

  return children;
}
