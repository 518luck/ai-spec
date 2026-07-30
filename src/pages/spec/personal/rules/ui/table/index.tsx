"use client";

// # 规约表格容器：数据请求 + 传统分页 + 行选择 + 批量删除 + 渲染表格
// > 数据由 useSWR 获取，通过 URL ?page=N&pageSize=N 控制翻页

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useState } from "react";
import useSWR from "swr";

import { deleteRules, getRules } from "@/entities/rule";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { PaginationBar } from "@/shared/ui/pagination-bar";
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
};

// 表格容器：负责数据请求、分页、行选择和批量删除逻辑
export function RuleTableContainer({
	folderId,
	spaceId,
	tagIds,
	q,
	onCreate,
}: RuleTableContainerProps): JSX.Element {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// 从 URL 读取页码（0-based，给 PaginationBar 用）和每页条数
	const page = parsePage(searchParams?.get(PAGE_PARAM) ?? null);
	const pageSize = parsePageSize(searchParams?.get(PAGE_SIZE_PARAM) ?? null, DEFAULT_PAGE_SIZE);

	// 获取规约列表，支持空间/文件夹/标签筛选和搜索 + 分页
	// page + 1：PaginationBar 用 0-based，API 用 1-based
	const { data, isLoading, mutate } = useSWR(
		["rules", folderId, spaceId, tagIds, q, page, pageSize],
		() => getRules({ folderId, spaceId, tagIds, q, page: page + 1, pageSize }),
	);

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

	// @ 行选择状态
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// 切换单行选中
	const toggleSelect = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	// 全选 / 取消全选当前页
	const toggleSelectAll = useCallback(() => {
		setSelectedIds((prev) => {
			if (prev.size === rules.length && rules.length > 0) return new Set();
			return new Set(rules.map((r) => r.id));
		});
	}, [rules]);

	// 清空选择
	const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

	// 批量删除确认回调
	const handleBatchDeleteConfirm = useCallback(async () => {
		setIsDeleting(true);
		try {
			await deleteRules([...selectedIds]);
			setSelectedIds(new Set());
			setConfirmOpen(false);
			await mutate();
		} catch {
			// deleteRule 内部已处理错误提示
		} finally {
			setIsDeleting(false);
		}
	}, [selectedIds, mutate]);

	return (
		<>
			<div className="flex max-h-[calc(100dvh-13rem)] flex-col overflow-hidden rounded-lg border">
				<div className="flex min-h-136 flex-col">
					<RuleTable
						rules={rules}
						isLoading={isLoading}
						q={q}
						onCreate={onCreate}
						selectedIds={selectedIds}
						onToggleSelect={toggleSelect}
						onToggleSelectAll={toggleSelectAll}
						onBatchDelete={() => setConfirmOpen(true)}
						onClearSelection={clearSelection}
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
			</div>

			{/* // @ 批量删除确认弹窗 */}
			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="批量删除规则"
				description={`此操作将永久删除选中的 ${selectedIds.size} 条规则。若已被 AGENTS.md 引用，引用处也会失效。`}
				confirmText={isDeleting ? "删除中..." : "删除"}
				variant="destructive"
				onConfirm={handleBatchDeleteConfirm}
				requireConfirmInput={{ expected: "确认删除" }}
			>
				<div className="flex flex-wrap gap-1.5">
					{rules
						.filter((r) => selectedIds.has(r.id))
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
