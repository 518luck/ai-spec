import type { JSX } from "react";

import prisma from "@/shared/db";
import { auth } from "@/shared/lib/auth/auth";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { HeaderedPageShell } from "@/widgets/page-shell";

import { CreateKeyButton } from "./create-key-button";
import { KeysTable } from "./keys-table";

// 渲染 API 密钥总览页面，以表格展示当前登录用户的全部令牌
export async function KeysPage(): Promise<JSX.Element> {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) {
    return (
      <HeaderedPageShell title="API 密钥">
        <EmptyState description="登录后即可管理你的 API 密钥" />
      </HeaderedPageShell>
    );
  }

  const tokens = await prisma.token.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      partial_key: true,
      // scopes 为空格分隔的权限串，split 后交给 scopesToName 反查展示标签
      scopes: true,
      // 最后使用时间，null 表示从未调用
      last_used: true,
    },
  });

  return (
    <HeaderedPageShell title={<KeysPageHeader />}>
      {tokens.length === 0 ? (
        <EmptyState description="还没有 API 密钥，创建一个开始接入吧" />
      ) : (
        // 表格 + 分页交由客户端组件渲染（分页按钮需要交互状态）
        <KeysTable tokens={tokens} />
      )}
    </HeaderedPageShell>
  );
}

// 标题区：主标题 + 说明问号 + 右上角创建按钮
function KeysPageHeader(): JSX.Element {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-1.5">
        <h1 className="text-lg font-semibold">API 密钥</h1>
        <HelpTooltip content="生成一枚用于程序化接入的密钥，仅归属于你的个人工作空间，创建后请妥善保存。" />
      </div>
      <CreateKeyButton />
    </div>
  );
}

type EmptyStateProps = {
  description: string;
};

// 列表为空或未登录时的占位提示
function EmptyState({ description }: EmptyStateProps): JSX.Element {
  return (
    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <Icons.key className="size-8 opacity-40" />
      <p className="text-sm">{description}</p>
    </div>
  );
}
