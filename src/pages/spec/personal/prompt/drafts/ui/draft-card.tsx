"use client";

import copy from "copy-to-clipboard";
import { type JSX, useState } from "react";
import useSWRMutation from "swr/mutation";
import { deleteDraft, getDraft } from "@/entities/prompt";
import { toast } from "@/features/toast";
import { deleteDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";

import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icons } from "@/shared/ui/icons";
import { PromptCard } from "../../shared/ui/prompt-card";
import { useDraftsMutate } from "../model/drafts-mutate-context";
import { EditDraftDialog } from "./edit-draft-dialog";
import { PromoteDraftPopover } from "./promote-draft-dialog";

type DraftCardProps = {
	// 草稿 ID
	id: string;
	// 草稿标题（必填，创建时已提取自第一个非空行）
	name: string;
	// 草稿预览（截断后的内容）
	preview: string;
};

// # 草稿卡片：基于 PromptCard，注入编辑 + 更多操作（复用/删除）+ 编辑弹窗
export function DraftCard({ id, name, preview }: DraftCardProps): JSX.Element {
	const [editOpen, setEditOpen] = useState(false);
	// 复制进行中标志：拉全文期间禁用按钮 + 触发卡片 loading 蒙层
	const [isCopying, setIsCopying] = useState(false);

	// 复制：拉全文 → 写剪贴板。一次性只读请求，不需要缓存，用裸 fetch + useState 最直接
	const handleCopy = async (): Promise<void> => {
		setIsCopying(true);
		try {
			const { content } = await getDraft(id);
			copy(content);
			toast.success("已复制");
		} catch {
			toast.error("复制失败");
		} finally {
			setIsCopying(false);
		}
	};

	return (
		<PromptCard
			name={name}
			preview={preview}
			onCopy={handleCopy}
			isCopying={isCopying}
			// > 底部 hover 遮罩的操作：编辑 + 复用 + 删除（各自独立子组件）
			actions={
				<>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="编辑"
						onClick={() => setEditOpen(true)}
					>
						<Icons.pencil className="size-4" />
					</Button>
					<PromoteDraftPopover
						id={id}
						name={name}
						trigger={
							<Button variant="ghost" size="icon-sm" aria-label="复用">
								<Icons.promote className="size-4" />
							</Button>
						}
					/>
					<DeleteDraftAction id={id} />
				</>
			}
		>
			{/* 编辑弹窗 */}
			<EditDraftDialog id={id} open={editOpen} onOpenChange={setEditOpen} />
		</PromptCard>
	);
}

// 删除按钮 + 二次确认：确认后删除并重拉列表；失败时 toast 提示并 rethrow 让弹窗保持打开
function DeleteDraftAction({ id }: { id: string }): JSX.Element {
	const mutateDrafts = useDraftsMutate();
	const [deleteOpen, setDeleteOpen] = useState(false);
	// 删除草稿 mutation；arg 为草稿 id
	const { trigger: triggerDeleteDraft } = useSWRMutation<void, Error, string, string>(
		"delete-draft",
		async (_key, { arg }) => deleteDraft(arg),
	);

	// 确认删除：id 守卫 + 删除 + 通过 infinite bound mutate 重拉所有已挂载页
	const handleConfirmDelete = async (): Promise<void> => {
		const parsed = deleteDraftDtoSchema.safeParse({ id });
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "删除失败");
			return;
		}
		try {
			await triggerDeleteDraft(parsed.data.id);
			await mutateDrafts();
			toast.success("已删除");
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "删除失败");
			throw error; // rethrow 让 ConfirmDialog 不关闭，保留弹窗供用户重试
		}
	};

	return (
		<>
			<Button variant="ghost" size="icon-sm" aria-label="删除" onClick={() => setDeleteOpen(true)}>
				<Icons.trash className="size-4" />
			</Button>
			{/* 删除二次确认：草稿为高频低价值内容，简单确认即可，无需输入文字 */}
			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title="删除草稿"
				description="此操作将永久删除该草稿，无法恢复。确定继续吗？"
				confirmText="删除"
				variant="destructive"
				onConfirm={handleConfirmDelete}
			/>
		</>
	);
}
