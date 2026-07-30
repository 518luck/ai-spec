"use client";

// # 规约版本页 —— 薄包装：注入 rule 的版本 API，复用通用版本页

import { type JSX, useMemo } from "react";
import { getRuleVersionDetail, getRuleVersions } from "@/entities/rule";
import { VersionPage, type VersionPageHandlers } from "@/pages/spec/versions";

// @ 组件 Props
interface RuleVersionsPageProps {
	ruleId: string;
}

export function RuleVersionsPage({ ruleId }: RuleVersionsPageProps): JSX.Element {
	// > 注入 rule 的版本数据源与行为给通用版本页
	const handlers = useMemo<VersionPageHandlers>(
		() => ({
			resourceId: ruleId,
			fetchVersions: async (pageIndex) => {
				// pageIndex 0-based，API 用 1-based
				const result = await getRuleVersions({ ruleId, page: pageIndex + 1 });
				// 透传分页元信息，通用版本页据此控制翻页停止与哨兵加载
				return {
					data: result.data.map((v) => ({ id: v.id, createdAt: v.createdAt })),
					hasMore: result.hasMore,
				};
			},
			fetchVersionContent: async (versionId) => {
				const detail = await getRuleVersionDetail({ ruleId, versionId });
				// name 作为标题独立展示，content 原样渲染，互不干扰
				return { title: detail.name, content: detail.content };
			},
			// 恢复此记录：带 useVersionId 回规约详情页，编辑器载入版本内容（不落库）
			buildUseUrl: (versionId) => `/spec/personal/rules/${ruleId}?useVersionId=${versionId}`,
		}),
		[ruleId],
	);

	return <VersionPage handlers={handlers} />;
}
