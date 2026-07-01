import dayjs from "dayjs";
import type { JSX } from "react";

import prisma from "@/shared/db";
import { auth } from "@/shared/lib/auth/auth";
import { scopesToName } from "@/shared/lib/ohs/local/appservice/rbac/scopes";
import { Badge } from "@/shared/ui/badge";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { HeaderedPageShell } from "@/widgets/page-shell";

import { CreateKeyButton } from "./create-key-button";
import { DeleteKeyButton } from "./delete-key-button";

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
        // 外层圆角边框：卡片式表格，overflow-hidden 让首尾行分隔线被圆角裁剪
        // table-fixed：列宽由表头决定，内容超出按各自截断策略处理，避免长密钥/描述撑乱布局
        <div className="overflow-hidden rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">名称</TableHead>
                <TableHead className="w-48">描述</TableHead>
                <TableHead className="w-40">密钥</TableHead>
                <TableHead className="w-20">权限</TableHead>
                <TableHead className="w-28">最后使用</TableHead>
                <TableHead className="w-16">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="truncate font-medium">
                    {token.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate">
                    {token.description?.trim() || "—"}
                  </TableCell>
                  <TableCell>
                    <code className="text-muted-foreground block truncate font-mono text-xs">
                      {token.partial_key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {scopesToName(token.scopes?.split(" ") ?? []).name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {token.last_used
                      ? dayjs(token.last_used).format("YYYY/MM/DD")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DeleteKeyButton name={token.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
