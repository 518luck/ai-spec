"use client";
// # 草稿创建弹窗 —— 薄包装，注入草稿专属的保存逻辑（SWR mutation + schema 校验）

import type { JSX } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { createDraft } from "@/entities/prompt";
import {
	type CreateDraftDto,
	type CreateDraftVo,
	createDraftDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/draft";
import { PromptEditorDialog, type PromptEditorSaveData } from "@/widgets/prompt-editor";

type CreateDraftDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateDraftDialog({ open, onOpenChange }: CreateDraftDialogProps): JSX.Element {
	// 创建草稿 mutation：trigger 触发请求，isMutating 自动管理 loading 状态
	const { mutate } = useSWRConfig();
	const { trigger: triggerCreateDraft, isMutating } = useSWRMutation<
		CreateDraftVo,
		Error,
		string,
		CreateDraftDto
	>("create-draft", async (_key, { arg }) => createDraft(arg));

	// 保存逻辑：schema 校验 + 创建 + 刷新缓存 + toast
	const handleSave = async (data: PromptEditorSaveData): Promise<void> => {
		const parsed = createDraftDtoSchema.safeParse({
			name: data.name,
			content: data.content,
			folder_id: data.folderId,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入草稿内容");
			return;
		}

		await triggerCreateDraft(parsed.data);
		// 刷新所有 drafts 相关的 SWR 缓存
		await mutate((key) => Array.isArray(key) && key[0] === "drafts");
		toast.success("草稿已创建");
	};

	return (
		<PromptEditorDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isMutating}
			resourceType="promptDraft"
			emptyTitle="无标题草稿"
		/>
	);
}
