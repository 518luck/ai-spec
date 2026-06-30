import dayjs from "dayjs";
import type { JSX } from "react";

import prisma from "@/shared/db";
import { auth } from "@/shared/lib/auth/auth";
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
      created_at: true,
    },
  });

  return (
    <HeaderedPageShell
      title={
        <div className="flex w-full items-center justify-between">
          <h1 className="text-lg font-semibold">API 密钥</h1>
          <CreateKeyButton />
        </div>
      }
    >
      {tokens.length === 0 ? (
        <EmptyState description="还没有 API 密钥，创建一个开始接入吧" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell className="font-medium">{token.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {token.description?.trim() || "—"}
                </TableCell>
                <TableCell>
                  <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                    {token.partial_key}
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dayjs(token.created_at).format("YYYY/MM/DD")}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteKeyButton name={token.name} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </HeaderedPageShell>
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
