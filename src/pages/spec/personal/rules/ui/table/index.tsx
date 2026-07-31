"use client";

// # 规约表格容器：数据请求 + 传统分页 + 行选择 + 批量删除
// > 数据由 TanStack Query 获取；表格渲染走 shadcn Data Table（columns + useReactTable）

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OnChangeFn, RowSelectionState, VisibilityState } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useMemo, useState } from "react";
import { ruleKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { PaginationBar } from "@/shared/ui/pagination-bar";
import { columns } from "./columns";
import { RuleTable } from "./table";

// 表格分页默认每页条数
const DEFAULT_PAGE_SIZE = 10;

// URL 中的参数名
const PAGE_PARAM = "page";
const PAGE_SIZE_PARAM = "pageSize";

// 每页条数可选值
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// 将 URL 里的 1-based 正整数页码转为内部 0-based 页码
const parsePage = (value: string | null): number => {
	if (!value || !/^[1-9]\d*$/.test(value)) return 0;

	const page = Number(value);
	return Number.isSafeInteger(page) ? page - 1 : 0;
};

// 从 URL 解析每页条数，非法值回退到默认值
const parsePageSize = (value: string | null, defaultSize: number): number => {
	if (!value || !/^[1-9]\d*$/.test(value)) return defaultSize;

	const size = Number(value);
	return Number.isSafeInteger(size) && size > 0 && size <= 100 ? size : defaultSize;
};

type RuleTableContainerProps = {
	folderId?: string;
	spaceId?: string;
	tagIds?: string;
	q?: string;
	onCreate?: () => void;
	// 列可见性（由 page 层持久化到 localStorage，toolbar 和 table 共享）
	columnVisibility: VisibilityState;
	onColumnVisibilityChange: OnChangeFn<VisibilityState>;
};

// 表格容器：负责数据请求、分页、行选择和批量删除逻辑
export function RuleTableContainer({
	folderId,
	spaceId,
	tagIds,
	q,
	onCreate,
	columnVisibility,
	onColumnVisibilityChange,
}: RuleTableContainerProps): JSX.Element {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const qc = useQueryClient();

	// 从 URL 读取页码（0-based，给 PaginationBar 用）和每页条数
	const page = parsePage(searchParams?.get(PAGE_PARAM) ?? null);
	const pageSize = parsePageSize(searchParams?.get(PAGE_SIZE_PARAM) ?? null, DEFAULT_PAGE_SIZE);

	// 获取规约列表，支持空间/文件夹/标签筛选和搜索 + 分页
	// page + 1：PaginationBar 用 0-based，API 用 1-based；queryKey 内嵌全部筛选+分页，任一变化即作废重拉
	const listParams = { folderId, spaceId, tagIds, q, page: page + 1, pageSize };
	const { data, isLoading } = useQuery({
		...orpc.rules.list.queryOptions({ input: listParams }),
	});
	// 批量删除：成功后按统一前缀失效所有规约查询
	const { mutateAsync: batchDelete } = useMutation({
		...orpc.rules.deleteMany.mutationOptions(),
		onSuccess: () => qc.invalidateQueries({ queryKey: ruleKeys.all }),
	});

	const rules = data?.data ?? [];
	const total = data?.total ?? 0;
	const hasMore = data?.hasMore ?? false;

	// 更新 URL 参数（保留现有参数，仅更新分页相关）
	const updateUrlParams = useCallback(
		(updates: Record<string, string | null>): void => {
			const params = new URLSearchParams(searchParams?.toString() ?? "");

			for (const [key, value] of Object.entries(updates)) {
				if (value === null || value === "" || value === "1") {
					params.delete(key);
				} else {
					params.set(key, value);
				}
			}

			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[pathname, router, searchParams],
	);

	// 翻页：更新 URL 页码
	const handlePageChange = useCallback(
		(direction: "prev" | "next"): void => {
			const targetPage = direction === "prev" ? page - 1 : page + 1;
			updateUrlParams({ [PAGE_PARAM]: String(targetPage + 1) });
		},
		[page, updateUrlParams],
	);

	// 回到首页
	const handleFirstPage = useCallback((): void => {
		updateUrlParams({ [PAGE_PARAM]: null });
	}, [updateUrlParams]);

	// 切换每页条数：重置到首页
	const handlePageSizeChange = useCallback(
		(size: number): void => {
			updateUrlParams({ [PAGE_SIZE_PARAM]: String(size), [PAGE_PARAM]: null });
		},
		[updateUrlParams],
	);

	// @ 行选择：TanStack RowSelectionState，key 为 rule.id
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// 当前选中的规则 id 列表
	const selectedIds = useMemo(
		() => Object.keys(rowSelection).filter((id) => rowSelection[id]),
		[rowSelection],
	);

	// 批量删除确认回调：调 batchDelete mutation，成功后 onSuccess 自动失效缓存
	const handleBatchDeleteConfirm = useCallback(async () => {
		setIsDeleting(true);
		try {
			await batchDelete({ ids: selectedIds });
			setRowSelection({});
			setConfirmOpen(false);
		} catch {
			// batchDelete 的 onError 由全局 MutationCache 统一 toast
		} finally {
			setIsDeleting(false);
		}
	}, [batchDelete, selectedIds]);

	return (
		<>
			{/* // > 外层边框壳；表格走 Data Table，分页贴底 */}
			<div className="overflow-hidden rounded-lg border">
				<RuleTable
					columns={columns}
					data={rules}
					isLoading={isLoading}
					q={q}
					onCreate={onCreate}
					rowSelection={rowSelection}
					onRowSelectionChange={setRowSelection}
					columnVisibility={columnVisibility}
					onColumnVisibilityChange={onColumnVisibilityChange}
					onBatchDelete={() => setConfirmOpen(true)}
				/>
				<PaginationBar
					page={page}
					total={total}
					hasMore={hasMore}
					pageSize={pageSize}
					onPageChange={handlePageChange}
					pageSizeOptions={PAGE_SIZE_OPTIONS}
					onPageSizeChange={handlePageSizeChange}
					onFirstPage={handleFirstPage}
				/>
			</div>

			{/* // @ 批量删除确认弹窗 */}
			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="批量删除规则"
				description={`此操作将永久删除选中的 ${selectedIds.length} 条规则。若已被 AGENTS.md 引用，引用处也会失效。`}
				confirmText={isDeleting ? "删除中..." : "删除"}
				variant="destructive"
				onConfirm={handleBatchDeleteConfirm}
				requireConfirmInput={{ expected: "确认删除" }}
			>
				<div className="flex flex-wrap gap-1.5">
					{rules
						.filter((r) => rowSelection[r.id])
						.map((r) => (
							<span
								key={r.id}
								className="inline-block max-w-48 truncate rounded-md bg-muted px-2 py-0.5 text-xs"
							>
								{r.name}
							</span>
						))}
				</div>
			</ConfirmDialog>
		</>
	);
}
