"use client";

import copy from "copy-to-clipboard";
import { type JSX, useState } from "react";
import useSWRMutation from "swr/mutation";
import { deleteDraft, getDraft } from "@/entities/prompt";
import { toast } from "@/features/toast";
import { deleteDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";

import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";
import { PromptCard } from "../../shared/ui/prompt-card";
import { useDraftsMutate } from "../model/drafts-mutate-context";
import { EditDraftDialog } from "./edit-draft-dialog";

type DraftCardProps = {
	// 草稿 ID
	id: string;
	// 草稿标题（必填，创建时已提取自第一个非空行）
	name: string;
	// 草稿预览（截断后的内容）
	preview: string;
};

// # 草稿卡片：基于 PromptCard，注入编辑 + 更多操作（收录/删除）+ 编辑弹窗
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
			// > 底部 hover 遮罩的操作：编辑 + 更多（收录/删除）
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
					<DraftActions id={id} />
				</>
			}
		>
			{/* 编辑弹窗 */}
			<EditDraftDialog draft={{ id, name }} open={editOpen} onOpenChange={setEditOpen} />
		</PromptCard>
	);
}

// 底部操作栏的"更多"菜单（收录/删除）；删除经 ConfirmDialog 二次确认
function DraftActions({ id }: { id: string }): JSX.Element {
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
		await triggerDeleteDraft(parsed.data.id);
		await mutateDrafts();
		toast.success("已删除");
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button variant="ghost" size="icon-sm" aria-label="更多操作">
							<Icons.more className="size-4" />
						</Button>
					}
				>
					<Icons.more className="size-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => toast.info("转正功能即将上线")}>
						<Icons.promote data-icon="inline-start" />
						收录
					</DropdownMenuItem>
					{/* 点「删除」打开确认弹窗，不直接执行 */}
					<DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
						<Icons.trash data-icon="inline-start" />
						删除
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

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
