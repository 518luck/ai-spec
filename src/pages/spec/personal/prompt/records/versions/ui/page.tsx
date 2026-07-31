"use client";

// # 收录版本页 —— 薄包装：注入资源标识与恢复 URL，复用通用版本页（数据由 VersionPage 经 oRPC 获取）

import { type JSX, useMemo } from "react";
import { VersionPage, type VersionPageHandlers } from "@/pages/spec/versions";

// @ 组件 Props
interface RecordVersionsPageProps {
	recordId: string;
}

export function RecordVersionsPage({ recordId }: RecordVersionsPageProps): JSX.Element {
	// > 注入资源标识与行为给通用版本页（版本数据由 VersionPage 经 orpc.records.versions 拉取）
	const handlers = useMemo<VersionPageHandlers>(
		() => ({
			resourceType: "record",
			resourceId: recordId,
			// 恢复此记录：带 recordId + versionId 回记录页，目标卡片自动开编辑器载入版本内容（不落库）
			buildUseUrl: (versionId) =>
				`/spec/personal/prompt/records?useRecordId=${recordId}&useVersionId=${versionId}`,
		}),
		[recordId],
	);

	return <VersionPage handlers={handlers} />;
}
