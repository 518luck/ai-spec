"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import dayjs from "dayjs";
import { type JSX, useMemo, useState } from "react";

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

import { TokenActions } from "./token-actions";

// 单条密钥的展示字段（由服务端查询后传入，客户端只负责渲染与分页）
type TokenItem = {
  id: string;
  name: string;
  description: string | null;
  partial_key: string;
  scopes: string | null;
  last_used: Date | null;
};

// 每页固定展示的密钥条数
const PAGE_SIZE = 10;

type KeysTableProps = {
  tokens: TokenItem[];
};

// 密钥列表：固定高度表格 + 底部分页（左侧计数、右侧上一页/下一页按钮）
export function KeysTable({ tokens }: KeysTableProps): JSX.Element {
  const [page, setPage] = useState(0);
  const total = tokens.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // 当前页越界（如删除后数据变少）时自动回退到最后一页
  const currentPage = Math.min(page, pageCount - 1);

  // 当前页要展示的切片，依赖 currentPage 与 tokens 变化时重算
  const visible = useMemo(
    () =>
      tokens.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE),
    [tokens, currentPage],
  );

  // 当前页起止序号（1-based），用于「第 X-Y 条，共 Z 条」文案
  const start = total === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const end = Math.min((currentPage + 1) * PAGE_SIZE, total);

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
            {visible.map((token) => (
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
                  <TokenActions name={token.name} />
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
            disabled={currentPage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="上一页"
          >
            <ChevronLeftIcon data-icon="inline-start" />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
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
