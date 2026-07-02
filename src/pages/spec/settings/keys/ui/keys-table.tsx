"use client";

import dayjs from "dayjs";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type JSX } from "react";

import { scopesToName } from "@/shared/lib/ohs/local/appservice/rbac/scopes";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { PAGE_SIZE } from "../config/constants";
import { TokenActions } from "./token-actions";

// 单条密钥的展示字段（由服务端按页查询后传入，客户端只负责渲染）
type TokenItem = {
  id: string;
  name: string;
  description: string | null;
  partial_key: string;
  scopes: string | null;
  last_used: Date | null;
};

type KeysTableProps = {
  tokens: TokenItem[];
  // 当前页码（0-based，由 URL ?page=N 转换而来）
  page: number;
  // 密钥总条数（服务端 count 得到，用于分页栏计数与翻页边界）
  total: number;
};

// 密钥列表：固定高度表格 + 底部分页（左侧计数、右侧上一页/下一页按钮）
// 数据已由服务端按页查询，这里直接展示 tokens；翻页通过 router.push 改 URL 触发服务端重渲染
export function KeysTable({
  tokens,
  page,
  total,
}: KeysTableProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);

  // 翻页：用目标页码（1-based）更新 URL 的 ?page=N，触发服务端重新按页查询
  const goToPage = (next: number): void => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(next + 1));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    // 外层圆角边框：卡片式表格；h-full 撑满父级，overflow-hidden 让首尾行分隔线被圆角裁剪
    <div className="flex h-full flex-col overflow-hidden rounded-lg border">
      {/* 表格区：flex-1 占据剩余高度；table 占满宽度保证行分隔线贯通，靠首末列 pl/pr 制造内容边距 */}
      <div className="flex-1 overflow-auto">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 pl-4">名称</TableHead>
              <TableHead className="w-48">描述</TableHead>
              <TableHead className="w-40">密钥</TableHead>
              <TableHead className="w-20">权限</TableHead>
              <TableHead className="w-28">最后使用</TableHead>
              <TableHead className="w-16 pr-4">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell className="truncate pl-4 font-medium">
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
                <TableCell className="pr-4">
                  <TokenActions id={token.id} name={token.name} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分页栏：左侧「第 X-Y 条，共 Z 条」；右侧上一页/下一页按钮 */}
      <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs">
        <span>
          第 {start}-{end} 条，共 {total} 条
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
            aria-label="上一页"
          >
            <ChevronLeftIcon data-icon="inline-start" />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount - 1}
            onClick={() => goToPage(page + 1)}
            aria-label="下一页"
          >
            下一页
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
