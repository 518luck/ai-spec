"use client";

// # 草稿编辑弹窗 —— 薄包装，打开时拉取草稿全文，注入更新逻辑（SWR mutation + schema 校验）

import type { JSX } from "react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { getDraft, updateDraft } from "@/entities/prompt";
import { toast } from "@/features/toast";
import {
	type CreateDraftVo,
	type UpdateDraftDto,
	updateDraftDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/draft";
import { type PromptEditorSaveData, PromptWorkspaceDialog } from "@/widgets/prompt-workspace";

type EditDraftDialogProps = {
	draft: {
		id: string;
		name: string | null;
		preview: string;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditDraftDialog({ draft, open, onOpenChange }: EditDraftDialogProps): JSX.Element {
	// 打开弹窗时拉取草稿全文（列表只有截断预览）
	const [fullDraft, setFullDraft] = useState<{
		content: string;
		folderId?: string;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		setIsLoading(true);
		getDraft(draft.id)
			.then((data) => {
				if (!cancelled) setFullDraft({ content: data.content, folderId: data.folderId });
			})
			.catch(() => {
				if (!cancelled) toast.error("加载草稿失败");
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [open, draft.id]);

	// 更新草稿 mutation
	const { mutate } = useSWRConfig();
	const { trigger: triggerUpdateDraft, isMutating } = useSWRMutation<
		CreateDraftVo,
		Error,
		string,
		UpdateDraftDto
	>("update-draft", async (_key, { arg }) => updateDraft(arg));

	// 更新逻辑：schema 校验 + 更新 + 刷新缓存 + toast
	const handleSave = async (data: PromptEditorSaveData): Promise<void> => {
		// 内容和文件夹都没变就不发请求
		const originalName = draft.name ?? "";
		const originalFolderId = fullDraft?.folderId ?? undefined;
		if (
			fullDraft &&
			data.content === fullDraft.content &&
			(data.name ?? "") === originalName &&
			data.folderId === originalFolderId
		) {
			return;
		}

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
		await mutate((key) => Array.isArray(key) && key[0] === "drafts");
		toast.success("草稿已更新");
	};

	// 加载中或未打开时不渲染编辑器（避免用 preview 当 initialContent）
	if (isLoading || !fullDraft) {
		return (
			<PromptWorkspaceDialog
				open={open}
				onOpenChange={onOpenChange}
				onSave={async () => {}}
				isSaving={isLoading}
				resourceType="promptDraft"
				initialContent={draft.preview}
				emptyTitle="无标题草稿"
				savingText="加载中..."
			/>
		);
	}

	return (
		<PromptWorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isMutating}
			resourceType="promptDraft"
			initialContent={fullDraft.content}
			initialFolderId={fullDraft.folderId}
			emptyTitle="无标题草稿"
			savingText="更新中..."
		/>
	);
}
