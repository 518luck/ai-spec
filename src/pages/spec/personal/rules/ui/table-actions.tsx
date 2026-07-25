"use client";

// # 规则行操作入口：「…」按钮触发下拉菜单，含编辑、删除；删除经 ConfirmDialog 二次确认

import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useState } from "react";
import useSWRMutation from "swr/mutation";

import { deleteRule } from "@/entities/rule";
import { toast } from "@/features/toast";
import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

// 删除前确认：规约被 AGENTS.md 引用后删除会影响引用方，文案强调需确认
const DELETE_CONFIRM_TEXT = "确认删除规则";

type TableActionsProps = {
	rule: RuleListItemVo;
};

export function TableActions({ rule }: TableActionsProps): JSX.Element {
	const router = useRouter();
	const [deleteOpen, setDeleteOpen] = useState(false);

	// 删除规约 mutation
	const { trigger: triggerDelete, isMutating: isDeleting } = useSWRMutation(
		"delete-rule",
		async () => deleteRule(rule.id),
	);

	// 跳转到编辑页面
	const handleEdit = (): void => {
		router.push(`/spec/personal/rules/${rule.id}/edit`);
	};

	const handleDeleteClick = (): void => {
		setDeleteOpen(true);
	};

	// 确认删除
	const handleConfirmDelete = async (): Promise<void> => {
		await triggerDelete();
		toast.success("规约已删除");
		setDeleteOpen(false);
		// 刷新列表
		router.refresh();
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<button
							type="button"
							className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
							aria-label="更多操作"
						/>
					}
				>
					<EllipsisIcon className="size-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={handleEdit}>
						<PencilIcon data-icon="inline-start" />
						编辑
					</DropdownMenuItem>
					<DropdownMenuItem variant="destructive" onClick={handleDeleteClick}>
						<Trash2Icon data-icon="inline-start" />
						删除
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title="删除规则"
				description="此操作将永久删除该规则。若已被 AGENTS.md 引用，引用处也会失效。确定要继续吗？"
				confirmText={isDeleting ? "删除中..." : "删除"}
				variant="destructive"
				onConfirm={handleConfirmDelete}
				requireConfirmInput={{ expected: DELETE_CONFIRM_TEXT }}
			>
				{/* 待删规则信息卡片 */}
				<div className="flex items-center gap-3 rounded-md border p-3">
					<span className="w-40 shrink-0 truncate font-medium text-sm">{rule.name}</span>
					<span className="min-w-0 flex-1 truncate text-right text-muted-foreground text-xs">
						{rule.preview}
					</span>
				</div>
			</ConfirmDialog>
		</>
	);
}
