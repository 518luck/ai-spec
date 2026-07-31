"use client";

// # 收录编辑弹窗 —— 薄包装，打开时拉取收录全文，注入更新逻辑（TanStack mutation + schema 校验）

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSX } from "react";
import { areTagsEqual } from "@/features/tag-combobox/lib";
import { toast } from "@/features/toast";
import { recordKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { RecordSchemas } from "@/shared/lib/zod/schemas/prompt/record";
import { type PromptEditorSaveData, PromptWorkspaceDialog } from "@/widgets/prompt-workspace";

type EditRecordDialogProps = {
	// 收录 ID：拉全文 + 更新的主键
	id: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 版本页「使用此版本」带回的 versionId，有值时编辑器用该版本内容初始化（不落库）
	useVersionId?: string | null;
	// 形变锚点 id：与来源卡片对上，弹窗从那张卡长出来
	morphId?: string;
};

export function EditRecordDialog({
	id,
	open,
	onOpenChange,
	useVersionId,
	morphId,
}: EditRecordDialogProps): JSX.Element {
	const qc = useQueryClient();
	// 打开弹窗时拉取收录全文（列表只有截断预览），用缓存避免重复请求；错误提示走全局 QueryCache
	const { data: fullRecord, isLoading } = useQuery({
		...orpc.records.getById.queryOptions({ input: { id } }),
		enabled: !!open,
	});
	// 有 useVersionId 时拉取该版本内容，作为编辑器初始内容（不落库，待编辑）
	const { data: versionContent } = useQuery({
		...orpc.records.versions.detail.queryOptions({
			input: { id, versionId: useVersionId ?? "" },
		}),
		// 弹窗打开且有 useVersionId 才拉版本详情
		enabled: !!open && !!useVersionId,
	});

	// 更新收录 mutation：input 形如 { id, ...payload }，id 走 URL 路径，其余字段进 body
	const { mutateAsync: updateRecordAsync, isPending } = useMutation({
		...orpc.records.update.mutationOptions(),
		onSuccess: () => {
			// 重拉所有已挂载页 + 失效当前收录全文缓存
			void qc.invalidateQueries({ queryKey: recordKeys.all });
		},
	});

	// 更新逻辑：schema 校验 + 更新 + toast
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

		// id 走 URL，body 只校验需要更新的字段
		const parsed = RecordSchemas.updateDto.safeParse({
			name: data.name,
			content: data.content,
			folderId: data.folderId,
			...(data.tags !== undefined && { tags: data.tags.map((t) => t.id) }),
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入收录内容");
			return;
		}

		await updateRecordAsync({ id, ...parsed.data });
		toast.success("收录已更新");
	};

	// useVersionId 优先：版本页「使用此版本」带回时用该版本内容初始化，否则用收录全文
	const effectiveContent = versionContent?.content ?? fullRecord?.content ?? "";
	// 有 useVersionId 时等版本内容拉完；否则等收录全文拉完
	const isLoadingState = useVersionId ? !versionContent : isLoading || !fullRecord;

	return (
		<PromptWorkspaceDialog
			open={open}
			onOpenChange={onOpenChange}
			onSave={handleSave}
			isSaving={isPending}
			isLoading={isLoadingState}
			resourceType="promptRecord"
			initialContent={effectiveContent}
			initialFolderId={fullRecord?.folderId}
			// > tagsEnabled 必须独立传：创建场景没 initialTags 但也要能选标签
			tagsEnabled
			initialTags={fullRecord?.tags}
			emptyTitle="无标题收录"
			savingText="更新中..."
			morphId={morphId}
		/>
	);
}
