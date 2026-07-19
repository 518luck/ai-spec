"use client";

// # 收录编辑弹窗 —— 薄包装，打开时拉取收录全文，注入更新逻辑（SWR mutation + schema 校验）

import type { JSX } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { getRecord, updateRecord } from "@/entities/prompt";
import { areTagsEqual } from "@/features/tag-combobox/lib";
import { toast } from "@/features/toast";
import {
	type CreateRecordVo,
	type UpdateRecordDto,
	updateRecordDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/record";
import { type PromptEditorSaveData, PromptWorkspaceDialog } from "@/widgets/prompt-workspace";
import { useRecordsMutate } from "../model/records-mutate-context";

type EditRecordDialogProps = {
	// 收录 ID：拉全文 + 更新的主键
	id: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditRecordDialog({ id, open, onOpenChange }: EditRecordDialogProps): JSX.Element {
	// 打开弹窗时拉取收录全文（列表只有截断预览），用 SWR 缓存避免重复请求；错误提示走全局 SWRConfig
	const { data: fullRecord, isLoading } = useSWR(
		open ? (["record", id] as const) : null,
		async ([, recordId]) => getRecord(recordId),
	);

	// 更新收录 mutation
	const mutateRecords = useRecordsMutate();
	const { trigger: triggerUpdateRecord, isMutating } = useSWRMutation<
		CreateRecordVo,
		Error,
		string,
		UpdateRecordDto
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

		const parsed = updateRecordDtoSchema.safeParse({
			id,
			name: data.name,
			content: data.content,
			folderId: data.folderId,
			...(data.tags !== undefined && { tags: data.tags.map((t) => t.id) }),
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入收录内容");
			return;
		}

		await triggerUpdateRecord(parsed.data);
		await mutateRecords();
		toast.success("收录已更新");
	};

	// 加载完成前用弹窗自带 loading 占位，避免用 preview 渲染编辑器
	const isLoadingState = isLoading || !fullRecord;

	return (
		<PromptWorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isMutating}
			isLoading={isLoadingState}
			resourceType="promptRecord"
			initialContent={fullRecord?.content ?? ""}
			initialFolderId={fullRecord?.folderId}
			// > tagsEnabled 必须独立传：创建场景没 initialTags 但也要能选标签
			tagsEnabled
			initialTags={fullRecord?.tags}
			emptyTitle="无标题收录"
			savingText="更新中..."
		/>
	);
}
