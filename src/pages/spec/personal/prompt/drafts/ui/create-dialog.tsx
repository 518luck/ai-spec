"use client";
// # 草稿创建弹窗 —— 薄包装，注入草稿专属的保存逻辑（SWR mutation + schema 校验）

import type { JSX } from "react";
import useSWRMutation from "swr/mutation";
import { createDraft } from "@/entities/prompt";
import { toast } from "@/features/toast";
import {
	type CreateDraftDto,
	type CreateDraftVo,
	createDraftDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/draft";
import { type EditorSaveData, WorkspaceDialog } from "@/widgets/prompt-workspace";
import { useMutate } from "../model/mutate-context";

type CreateDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateDialog({ open, onOpenChange }: CreateDialogProps): JSX.Element {
	// 创建草稿 mutation：trigger 触发请求，isMutating 自动管理 loading 状态
	const mutateDrafts = useMutate();
	const { trigger: triggerCreateDraft, isMutating } = useSWRMutation<
		CreateDraftVo,
		Error,
		string,
		CreateDraftDto
	>("create-draft", async (_key, { arg }) => createDraft(arg));

	// 保存逻辑：schema 校验 + 创建 + 刷新缓存 + toast
	const handleSave = async (data: EditorSaveData): Promise<void> => {
		const parsed = createDraftDtoSchema.safeParse({
			name: data.name,
			content: data.content,
			folderId: data.folderId,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入草稿内容");
			return;
		}

		await triggerCreateDraft(parsed.data);
		await mutateDrafts();
		toast.success("草稿已创建");
	};

	return (
		<WorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isMutating}
			resourceType="promptDraft"
			emptyTitle="无标题草稿"
		/>
	);
}
