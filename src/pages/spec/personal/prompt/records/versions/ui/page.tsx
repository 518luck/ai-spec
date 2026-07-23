"use client";

// # 收录版本页 —— 薄包装：注入 prompt records 的版本 API，复用通用版本页

import { type JSX, useMemo } from "react";
import { getVersionDetail } from "@/entities/prompt/records/api/get-version-detail";
import { getVersions } from "@/entities/prompt/records/api/get-versions";
import { VersionPage, type VersionPageHandlers } from "@/pages/spec/versions";

// @ 组件 Props
interface RecordVersionsPageProps {
	recordId: string;
}

export function RecordVersionsPage({ recordId }: RecordVersionsPageProps): JSX.Element {
	// > 注入 prompt records 的版本数据源与行为给通用版本页
	const handlers = useMemo<VersionPageHandlers>(
		() => ({
			resourceId: recordId,
			fetchVersions: async (offset) => {
				const result = await getVersions({ recordId, offset });
				// 透传分页元信息，通用版本页据此控制翻页停止与哨兵加载
				return {
					data: result.data.map((v) => ({ id: v.id, createdAt: v.createdAt })),
					hasMore: result.hasMore,
					nextOffset: result.nextOffset,
				};
			},
			fetchVersionContent: async (versionId) => {
				const detail = await getVersionDetail({ recordId, versionId });
				// name 作为标题独立展示，content 原样渲染，互不干扰
				return { title: detail.name, content: detail.content };
			},
			// 恢复此记录：带 recordId + versionId 回记录页，目标卡片自动开编辑器载入版本内容（不落库）
			buildUseUrl: (versionId) =>
				`/spec/personal/prompt/records?useRecordId=${recordId}&useVersionId=${versionId}`,
		}),
		[recordId],
	);

	return <VersionPage handlers={handlers} />;
}
