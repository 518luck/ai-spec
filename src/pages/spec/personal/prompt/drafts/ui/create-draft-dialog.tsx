"use client";
// # 草稿创建弹窗 —— 薄包装，注入草稿专属的保存逻辑（TanStack mutation + schema 校验）

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { JSX } from "react";

import { toast } from "@/features/toast";
import { draftKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { createDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";
import { type PromptEditorSaveData, PromptWorkspaceDialog } from "@/widgets/prompt-workspace";

type CreateDraftDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateDraftDialog({ open, onOpenChange }: CreateDraftDialogProps): JSX.Element {
	const qc = useQueryClient();
	// 创建草稿 mutation：mutateAsync 触发请求，isPending 自动管理 loading 状态；成功后重拉所有已挂载页
	const { mutateAsync: createDraftAsync, isPending } = useMutation({
		...orpc.drafts.create.mutationOptions(),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: draftKeys.all });
		},
	});

	// 保存逻辑：schema 校验 + 创建 + toast
	const handleSave = async (data: PromptEditorSaveData): Promise<void> => {
		const parsed = createDraftDtoSchema.safeParse({
			name: data.name,
			content: data.content,
			folderId: data.folderId,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入草稿内容");
			return;
		}

		await createDraftAsync(parsed.data);
		toast.success("草稿已创建");
	};

	return (
		<PromptWorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isPending}
			resourceType="promptDraft"
			emptyTitle="无标题草稿"
		/>
	);
}
