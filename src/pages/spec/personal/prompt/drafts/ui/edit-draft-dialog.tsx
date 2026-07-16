"use client";

// # 草稿编辑弹窗 —— 薄包装，注入草稿专属的更新逻辑（SWR mutation + schema 校验）

import type { JSX } from "react";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { updateDraft } from "@/entities/prompt";
import { toast } from "@/features/toast";
import {
	type CreateDraftVo,
	type UpdateDraftDto,
	updateDraftDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/draft";
import { PromptEditorDialog, type PromptEditorSaveData } from "@/widgets/prompt-editor";

type EditDraftDialogProps = {
	draft: {
		id: string;
		name: string | null;
		content: string;
		folderId?: string;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditDraftDialog({ draft, open, onOpenChange }: EditDraftDialogProps): JSX.Element {
	// 更新草稿 mutation：trigger 触发请求，isMutating 自动管理 loading 状态
	const { mutate } = useSWRConfig();
	const { trigger: triggerUpdateDraft, isMutating } = useSWRMutation<
		CreateDraftVo,
		Error,
		string,
		UpdateDraftDto
	>("update-draft", async (_key, { arg }) => updateDraft(arg));

	// 更新逻辑：schema 校验 + 更新 + 刷新缓存 + toast
	const handleSave = async (data: PromptEditorSaveData): Promise<void> => {
		const parsed = updateDraftDtoSchema.safeParse({
			id: draft.id,
			name: data.name,
			content: data.content,
			folderId: data.folderId,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入草稿内容");
			return;
		}

		await triggerUpdateDraft(parsed.data);
		// 刷新所有 drafts 相关的 SWR 缓存
		await mutate((key) => Array.isArray(key) && key[0] === "drafts");
		toast.success("草稿已更新");
	};

	return (
		<PromptEditorDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isMutating}
			resourceType="promptDraft"
			initialContent={draft.content}
			initialFolderId={draft.folderId}
			emptyTitle="无标题草稿"
			savingText="更新中..."
		/>
	);
}
