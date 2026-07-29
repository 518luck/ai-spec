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

type RuleTableContainerProps = {
	folderId?: string;
	spaceId?: string;
	tagIds?: string;
	q?: string;
};

// 表格容器：负责数据请求和分页逻辑
export function RuleTableContainer({
	folderId,
	spaceId,
	tagIds,
	q,
}: RuleTableContainerProps): JSX.Element {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// 分页：从 URL 读页码（1-based），内部 0-based
	const page = Math.max(0, (Number(searchParams?.get("page")) || 1) - 1);
	const offset = page * PAGE_SIZE;

	// 获取规约列表，支持空间/文件夹/标签筛选和搜索 + 分页
	const { data, isLoading } = useSWR(["rules", folderId, spaceId, tagIds, q, offset], () =>
		getRules({ folderId, spaceId, tagIds, q, offset, limit: PAGE_SIZE }),
	);

	const rules = data?.data ?? [];
	const total = data?.total ?? 0;
	const hasMore = data?.hasMore ?? false;

	// 翻页：更新 URL ?page=N，触发 SWR 重新请求
	const handlePageChange = (direction: "prev" | "next"): void => {
		const target = direction === "prev" ? page - 1 : page + 1;
		const params = new URLSearchParams(searchParams?.toString() ?? "");
		if (target === 0) params.delete("page");
		else params.set("page", String(target + 1));
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	// 每行约 52px，表头 40px，10 条数据约 540px
	const TABLE_HEIGHT = 540;

	return (
		<div
			className="flex flex-col overflow-hidden rounded-lg border"
			style={{ height: TABLE_HEIGHT }}
		>
			<RuleTable rules={rules} isLoading={isLoading} />
			<PaginationBar
				total={total}
				hasMore={hasMore}
				pageSize={PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
}
