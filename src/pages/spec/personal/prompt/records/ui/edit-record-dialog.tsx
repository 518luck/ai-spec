"use client";

// # 收录编辑弹窗 —— 薄包装，打开时拉取收录全文，注入更新逻辑（SWR mutation + schema 校验）

import type { JSX } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { getRecord, updateRecord } from "@/entities/prompt";
import { getVersionDetail } from "@/entities/prompt/records/api/get-version-detail";
import type { UpdateRecordArgs } from "@/entities/prompt/records/api/update-record";
import { areTagsEqual } from "@/features/tag-combobox/lib";
import { toast } from "@/features/toast";
import { type CreateRecordVo, updateRecordDtoSchema } from "@/shared/lib/zod/schemas/prompt/record";
import { type PromptEditorSaveData, PromptWorkspaceDialog } from "@/widgets/prompt-workspace";
import { useRecordsMutate } from "../model/records-mutate-context";

type EditRecordDialogProps = {
	// 收录 ID：拉全文 + 更新的主键
	id: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 版本页「使用此版本」带回的 versionId，有值时编辑器用该版本内容初始化（不落库）
	useVersionId?: string | null;
};

export function EditRecordDialog({
	id,
	open,
	onOpenChange,
	useVersionId,
}: EditRecordDialogProps): JSX.Element {
	// 打开弹窗时拉取收录全文（列表只有截断预览），用 SWR 缓存避免重复请求；错误提示走全局 SWRConfig
	const { data: fullRecord, isLoading } = useSWR(
		open ? (["record", id] as const) : null,
		async ([, recordId]) => getRecord(recordId),
	);
	// 有 useVersionId 时拉取该版本内容，作为编辑器初始内容（不落库，待编辑）
	const { data: versionContent } = useSWR(
		open && useVersionId ? (["version-detail", id, useVersionId] as const) : null,
		async ([, recordId, versionId]) => getVersionDetail({ recordId, versionId }),
	);

	// 更新收录 mutation：arg 形如 { id, ...payload }，id 走 URL 路径，其余字段进 body
	const mutateRecords = useRecordsMutate();
	const { trigger: triggerUpdateRecord, isMutating } = useSWRMutation<
		CreateRecordVo,
		Error,
		string,
		UpdateRecordArgs
	>("update-record", async (_key, { arg }) => updateRecord(arg));

	// 更新逻辑：schema 校验 + 更新 + 刷新缓存 + toast
	const handleSave = async (data: PromptEditorSaveData): Promise<void> => {
		// name/content/folderId/tags 都没变就不发请求（name 从全文响应取，不依赖外部传入）
		const originalFolderId = fullRecord?.folderId ?? null;
		const originalTags = fullRecord?.tags ?? [];
		// data.tags === undefined 表示用户本次没传 tags 字段（不更新标签），视为不变
		const tagsUnchanged = data.tags === undefined || areTagsEqual(data.tags, originalTags);
		if (
			fullRecord &&
			data.content === fullRecord.content &&
			data.name === fullRecord.name &&
			data.folderId === originalFolderId &&
			tagsUnchanged
		) {
			return;
		}

		// id 走 URL，body 只校验需要更新的字段
		const parsed = updateRecordDtoSchema.safeParse({
			name: data.name,
			content: data.content,
			folderId: data.folderId,
			...(data.tags !== undefined && { tags: data.tags.map((t) => t.id) }),
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入收录内容");
			return;
		}

		await triggerUpdateRecord({ id, ...parsed.data });
		await mutateRecords();
		toast.success("收录已更新");
	};

	// useVersionId 优先：版本页「使用此版本」带回时用该版本内容初始化，否则用收录全文
	const effectiveContent = versionContent?.content ?? fullRecord?.content ?? "";
	// 有 useVersionId 时等版本内容拉完；否则等收录全文拉完
	const isLoadingState = useVersionId ? !versionContent : isLoading || !fullRecord;

	return (
		<PromptWorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isMutating}
			isLoading={isLoadingState}
			resourceType="promptRecord"
			initialContent={effectiveContent}
			initialFolderId={fullRecord?.folderId}
			// > tagsEnabled 必须独立传：创建场景没 initialTags 但也要能选标签
			tagsEnabled
			initialTags={fullRecord?.tags}
			emptyTitle="无标题收录"
			savingText="更新中..."
		/>
	);
}
