"use client";

// # 收录页标签筛选器：URL ?tagIds=a,b,c 驱动，选中后服务端自动重新筛选列表

import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useMemo } from "react";
import useSWR from "swr";
import { getTags } from "@/entities/tag";
import { TagCombobox } from "@/features/tag-combobox";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";

// > 收录页的标签多选筛选：URL 驱动，从全局 tag 列表派生已选对象供 TagCombobox 展示 chips
export function RecordTagFilter(): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();

	// tagIds 来自 URL（逗号分隔），用 useMemo 稳定数组引用避免下游反复重渲染
	const selectedIds = useMemo(() => {
		const param = searchParams?.get("tagIds") ?? "";
		return param
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}, [searchParams]);

	// 拉取全局 tag 列表，用于把 id 反查成完整 {id,name,color}（chips 展示需要 name/color）
	const { data: allTags } = useSWR(["tags"], () => getTags());

	// 已选的完整对象：从全局列表里按 id 派生；列表还没加载完时先空着，加载完自动回填
	const selected = useMemo<TagOptionVo[]>(() => {
		if (!allTags) return [];
		const idSet = new Set(selectedIds);
		return allTags.filter((t) => idSet.has(t.id));
	}, [allTags, selectedIds]);

	// 选中变化时写回 URL（用 id 列表）
	const handleChange = useCallback(
		(tags: TagOptionVo[]) => {
			const params = new URLSearchParams(searchParams?.toString() ?? "");
			if (tags.length > 0) {
				params.set("tagIds", tags.map((t) => t.id).join(","));
			} else {
				params.delete("tagIds");
			}
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	return <TagCombobox value={selected} onChange={handleChange} className="min-w-40" />;
}
