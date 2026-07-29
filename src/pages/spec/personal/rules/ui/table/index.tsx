"use client";

// # 规约表格容器：数据请求 + 传统分页 + 渲染表格
// > 数据由 useSWR 获取，通过 URL ?page=N 控制翻页

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import useSWR from "swr";

import { getRules } from "@/entities/rule";
import { PaginationBar } from "@/shared/ui/pagination-bar";
import { RuleTable } from "./table";

// 表格分页每页条数
const PAGE_SIZE = 10;

// URL 中的页码参数名
const PAGE_PARAM = "page";

// 将 URL 里的 1-based 正整数页码转为内部 0-based 页码
const parsePage = (value: string | null): number => {
	if (!value || !/^[1-9]\d*$/.test(value)) return 0;

	const page = Number(value);
	return Number.isSafeInteger(page) ? page - 1 : 0;
};

type RuleTableContainerProps = {
	folderId?: string;
	spaceId?: string;
	tagIds?: string;
	q?: string;
	onCreate?: () => void;
};

// 表格容器：负责数据请求和分页逻辑
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

	// 从 URL 读取页码，换算为 API 所需的偏移量
	const page = parsePage(searchParams?.get(PAGE_PARAM) ?? null);
	const offset = page * PAGE_SIZE;

	// 获取规约列表，支持空间/文件夹/标签筛选和搜索 + 分页
	const { data, isLoading } = useSWR(["rules", folderId, spaceId, tagIds, q, offset], () =>
		getRules({ folderId, spaceId, tagIds, q, offset, limit: PAGE_SIZE }),
	);

	const rules = data?.data ?? [];
	const total = data?.total ?? 0;
	const hasMore = data?.hasMore ?? false;

	// 翻页：更新 URL 页码，触发 SWR 重新请求
	const handlePageChange = (direction: "prev" | "next"): void => {
		const targetPage = direction === "prev" ? page - 1 : page + 1;
		const params = new URLSearchParams(searchParams?.toString() ?? "");

		if (targetPage <= 0) params.delete(PAGE_PARAM);
		else params.set(PAGE_PARAM, String(targetPage + 1));

		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	// 每行约 52px，表头 40px，10 条数据约 540px
	const TABLE_HEIGHT = 540;

	return (
		<div
			className="flex flex-col overflow-hidden rounded-lg border"
			style={{ height: TABLE_HEIGHT }}
		>
			<RuleTable rules={rules} isLoading={isLoading} q={q} onCreate={onCreate} />
			<PaginationBar
				page={page}
				total={total}
				hasMore={hasMore}
				pageSize={PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
}
