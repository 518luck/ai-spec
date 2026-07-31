"use client";

// # 规约版本页 —— 薄包装：注入资源标识与恢复 URL，复用通用版本页（数据由 VersionPage 经 oRPC 获取）

import { type JSX, useMemo } from "react";
import { VersionPage, type VersionPageHandlers } from "@/pages/spec/versions";

// @ 组件 Props
interface RuleVersionsPageProps {
	ruleId: string;
}

export function RuleVersionsPage({ ruleId }: RuleVersionsPageProps): JSX.Element {
	// > 注入资源标识与行为给通用版本页（版本数据由 VersionPage 经 orpc.rules.versions 拉取）
	const handlers = useMemo<VersionPageHandlers>(
		() => ({
			resourceType: "rule",
			resourceId: ruleId,
			// 恢复此记录：带 useVersionId 回规约详情页，编辑器载入版本内容（不落库）
			buildUseUrl: (versionId) => `/spec/personal/rules/${ruleId}?useVersionId=${versionId}`,
		}),
		[ruleId],
	);

	return <VersionPage handlers={handlers} />;
}
