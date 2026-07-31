"use client";
// # 收录创建弹窗 —— 薄包装，注入收录专属的保存逻辑（TanStack mutation + schema 校验）

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { JSX } from "react";

import { toast } from "@/features/toast";
import { recordKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { RecordSchemas } from "@/shared/lib/zod/schemas/prompt/record";
import { type PromptEditorSaveData, PromptWorkspaceDialog } from "@/widgets/prompt-workspace";

type CreateRecordDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateRecordDialog({ open, onOpenChange }: CreateRecordDialogProps): JSX.Element {
	const qc = useQueryClient();
	// 创建收录 mutation：mutateAsync 触发请求，isPending 自动管理 loading 状态；成功后重拉所有已挂载页
	const { mutateAsync: createRecordAsync, isPending } = useMutation({
		...orpc.records.create.mutationOptions(),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: recordKeys.all });
		},
	});

	// 保存逻辑：name 兜底 + schema 校验 + 创建 + toast
	const handleSave = async (data: PromptEditorSaveData): Promise<void> => {
		const parsed = RecordSchemas.createDto.safeParse({
			name: data.name || "无标题收录",
			content: data.content,
			folderId: data.folderId,
			images: [],
			...(data.tags !== undefined && { tags: data.tags.map((t) => t.id) }),
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入收录内容");
			return;
		}

		await createRecordAsync(parsed.data);
		toast.success("收录已创建");
	};

	return (
		<PromptWorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isPending}
			resourceType="promptRecord"
			// > 启用标签：创建模式即可给新收录打标签
			tagsEnabled
			emptyTitle="无标题收录"
		/>
	);
}
