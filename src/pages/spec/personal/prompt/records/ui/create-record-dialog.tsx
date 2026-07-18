"use client";
// # 收录创建弹窗 —— 薄包装，注入收录专属的保存逻辑（SWR mutation + schema 校验）

import type { JSX } from "react";
import useSWRMutation from "swr/mutation";

import { createRecord } from "@/entities/prompt";
import { toast } from "@/features/toast";
import {
	type CreateRecordDto,
	type CreateRecordVo,
	createRecordDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/record";
import { type PromptEditorSaveData, PromptWorkspaceDialog } from "@/widgets/prompt-workspace";

type CreateRecordDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateRecordDialog({ open, onOpenChange }: CreateRecordDialogProps): JSX.Element {
	// 创建收录 mutation：trigger 触发请求，isMutating 自动管理 loading 状态
	const { trigger: triggerCreateRecord, isMutating } = useSWRMutation<
		CreateRecordVo,
		Error,
		string,
		CreateRecordDto
	>("create-record", async (_key, { arg }) => createRecord(arg));

	// 保存逻辑：name 兜底 + schema 校验 + 创建 + toast（收录页暂无列表，不刷新缓存）
	const handleSave = async (data: PromptEditorSaveData): Promise<void> => {
		const parsed = createRecordDtoSchema.safeParse({
			name: data.name || "无标题收录",
			content: data.content,
			folderId: data.folderId,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入收录内容");
			return;
		}

		await triggerCreateRecord(parsed.data);
		toast.success("收录已创建");
	};

	return (
		<PromptWorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isMutating}
			resourceType="promptRecord"
			emptyTitle="无标题收录"
		/>
	);
}
