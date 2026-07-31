"use client";

// # 草稿编辑弹窗 —— 薄包装，打开时拉取草稿全文，注入更新逻辑（TanStack mutation + schema 校验）

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSX } from "react";

import { toast } from "@/features/toast";
import { draftKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { DraftSchemas } from "@/shared/lib/zod/schemas/prompt/draft";
import { type PromptEditorSaveData, PromptWorkspaceDialog } from "@/widgets/prompt-workspace";

type EditDraftDialogProps = {
	// 草稿 ID：拉全文 + 更新的主键
	id: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 形变锚点 id：与来源卡片对上，弹窗从那张卡长出来
	morphId?: string;
};

export function EditDraftDialog({
	id,
	open,
	onOpenChange,
	morphId,
}: EditDraftDialogProps): JSX.Element {
	const qc = useQueryClient();
	// 打开弹窗时拉取草稿全文（列表只有截断预览），用缓存避免重复请求；错误提示走全局 QueryCache
	const { data: fullDraft, isLoading } = useQuery({
		...orpc.drafts.getById.queryOptions({ input: { id } }),
		enabled: !!open,
	});

	// 更新草稿 mutation：input 形如 { id, ...payload }，id 走 URL 路径，其余字段进 body
	const { mutateAsync: updateDraftAsync, isPending } = useMutation({
		...orpc.drafts.update.mutationOptions(),
		onSuccess: () => {
			// 重拉所有已挂载页 + 失效当前草稿全文缓存
			void qc.invalidateQueries({ queryKey: draftKeys.all });
		},
	});

	// 更新逻辑：schema 校验 + 更新 + toast
	const handleSave = async (data: PromptEditorSaveData): Promise<void> => {
		// name/content/folderId 都没变就不发请求（name 从全文响应取，不依赖外部传入；draft 的 name 可能为 null）
		const originalFolderId = fullDraft?.folderId ?? null;
		if (
			fullDraft &&
			data.content === fullDraft.content &&
			data.name === fullDraft.name &&
			data.folderId === originalFolderId
		) {
			return;
		}

		// id 走 URL，body 只校验需要更新的字段
		const parsed = DraftSchemas.updateDto.safeParse({
			name: data.name,
			content: data.content,
			folderId: data.folderId,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入草稿内容");
			return;
		}

		await updateDraftAsync({ id, ...parsed.data });
		toast.success("草稿已更新");
	};

	// 加载完成前用弹窗自带 loading 占位，避免用 preview 渲染编辑器
	const isLoadingState = isLoading || !fullDraft;

	return (
		<PromptWorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isPending}
			isLoading={isLoadingState}
			resourceType="promptDraft"
			initialContent={fullDraft?.content ?? ""}
			initialFolderId={fullDraft?.folderId}
			emptyTitle="无标题草稿"
			savingText="更新中..."
			morphId={morphId}
		/>
	);
}
