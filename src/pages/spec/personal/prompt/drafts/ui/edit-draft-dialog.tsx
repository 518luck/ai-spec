"use client";

// # 草稿编辑弹窗 —— 薄包装，打开时拉取草稿全文，注入更新逻辑（SWR mutation + schema 校验）

import type { JSX } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { getDraft, updateDraft } from "@/entities/prompt";
import { toast } from "@/features/toast";
import {
	type CreateDraftVo,
	type UpdateDraftDto,
	updateDraftDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/draft";
import { type PromptEditorSaveData, PromptWorkspaceDialog } from "@/widgets/prompt-workspace";
import { useDraftsMutate } from "../model/drafts-mutate-context";

type EditDraftDialogProps = {
	// 草稿 ID：拉全文 + 更新的主键
	id: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditDraftDialog({ id, open, onOpenChange }: EditDraftDialogProps): JSX.Element {
	// 打开弹窗时拉取草稿全文（列表只有截断预览），用 SWR 缓存避免重复请求；错误提示走全局 SWRConfig
	const { data: fullDraft, isLoading } = useSWR(
		open ? (["draft", id] as const) : null,
		async ([, draftId]) => getDraft(draftId),
	);

	// 更新草稿 mutation
	const mutateDrafts = useDraftsMutate();
	const { trigger: triggerUpdateDraft, isMutating } = useSWRMutation<
		CreateDraftVo,
		Error,
		string,
		UpdateDraftDto
	>("update-draft", async (_key, { arg }) => updateDraft(arg));

	// 更新逻辑：schema 校验 + 更新 + 刷新缓存 + toast
	const handleSave = async (data: PromptEditorSaveData): Promise<void> => {
		// name/content/folderId 都没变就不发请求（name 从全文响应取，不依赖外部传入；draft 的 name 可能为 null）
		const originalFolderId = fullDraft?.folderId ?? undefined;
		if (
			fullDraft &&
			data.content === fullDraft.content &&
			data.name === fullDraft.name &&
			data.folderId === originalFolderId
		) {
			return;
		}

		const parsed = updateDraftDtoSchema.safeParse({
			id,
			name: data.name,
			content: data.content,
			folderId: data.folderId,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入草稿内容");
			return;
		}

		await triggerUpdateDraft(parsed.data);
		await mutateDrafts();
		toast.success("草稿已更新");
	};

	// 加载完成前用弹窗自带 loading 占位，避免用 preview 渲染编辑器
	const isLoadingState = isLoading || !fullDraft;

	return (
		<PromptWorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isMutating}
			isLoading={isLoadingState}
			resourceType="promptDraft"
			initialContent={fullDraft?.content ?? ""}
			initialFolderId={fullDraft?.folderId}
			emptyTitle="无标题草稿"
			savingText="更新中..."
		/>
	);
}
