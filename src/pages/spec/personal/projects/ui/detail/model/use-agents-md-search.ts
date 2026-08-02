// # 配置搜索数据流 hook：URL 解码（词/字段/范围）+ 本项目/全项目双查询 + 展示列表派生
// > 组件只消费返回值，不关心查询细节；"搜内容"需后端全文（前端预取只有 name+excerpt）

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { client } from "@/shared/lib/orpc/client";
import { decodeFilters, type SearchFilters } from "@/shared/lib/search-filter-codec";
import type {
	AgentsMdListItemVo,
	AgentsMdSearchFieldKey,
	AgentsMdSearchListVo,
} from "@/shared/lib/zod/schemas/project";

export const useAgentsMdSearch = (
	projectId: string,
	folderAgentsMds: AgentsMdListItemVo[],
): {
	searchQuery: string;
	isAllScope: boolean;
	searchEnabled: boolean;
	visibleAgentsMds: AgentsMdListItemVo[];
	projectNames?: Record<string, string>;
	allScopeResults?: AgentsMdSearchListVo;
} => {
	// URL 输入：搜索词 + 筛选条件（字段开关/范围）解码
	const searchParams = useSearchParams();
	const searchQuery = searchParams?.get("q") ?? "";
	const searchFilters: SearchFilters = useMemo(
		() => decodeFilters(searchParams?.get("filter") ?? undefined) ?? {},
		[searchParams],
	);
	// 搜索范围：缺省本项目；参与搜索的字段：按开关收集（title 开关对应后端的 name 字段——配置以文件名为标识）
	const searchScope = searchFilters.scope ?? "project";
	const searchFields = useMemo(() => {
		const fields: AgentsMdSearchFieldKey[] = [];
		if (searchFilters.title) fields.push("name");
		if (searchFilters.content) fields.push("content");
		return fields;
	}, [searchFilters]);
	// 字段 join 成字符串作 queryKey 的一部分（数组引用不稳定，直接作 key 会多请求）
	const searchFieldsKey = searchFields.join(",");

	// 双范围查询：按 scope 互斥启用（enabled 带 scope 判断），data 类型各自明确
	const isAllScope = searchScope === "all";
	const searchEnabled = Boolean(searchQuery.trim());
	const { data: allScopeResults } = useQuery({
		queryKey: ["agentsMd-search", projectId, searchScope, searchQuery, searchFieldsKey],
		queryFn: () => client.agentsMds.listAll({ q: searchQuery, fields: searchFields }),
		enabled: searchEnabled && isAllScope,
	});
	const { data: projectResults } = useQuery({
		queryKey: ["agentsMd-search", projectId, searchScope, searchQuery, searchFieldsKey],
		queryFn: () => client.agentsMds.list({ projectId, q: searchQuery, fields: searchFields }),
		enabled: searchEnabled && !isAllScope,
	});
	const searchResults = isAllScope ? allScopeResults : projectResults;

	// 展示列表：搜索态为后端结果，否则为当前文件夹子树
	const visibleAgentsMds = useMemo(() => {
		if (!searchEnabled) return folderAgentsMds;
		return searchResults ?? [];
	}, [searchEnabled, folderAgentsMds, searchResults]);
	// 全项目搜索时：docId → 项目名（卡片底部标注项目归属）；本项目搜索仍用文件夹名映射
	const projectNames = useMemo(() => {
		if (!isAllScope) return undefined;
		return Object.fromEntries((allScopeResults ?? []).map((item) => [item.id, item.projectName]));
	}, [isAllScope, allScopeResults]);

	return {
		searchQuery,
		isAllScope,
		searchEnabled,
		visibleAgentsMds,
		projectNames,
		allScopeResults,
	};
};
