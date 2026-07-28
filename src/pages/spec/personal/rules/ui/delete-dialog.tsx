"use client";

// # 删除规约二次确认弹窗：表格行「…」菜单与卡片删除按钮共用
// > 删完用 SWR 全局 mutate 按 key 前缀重拉所有规约列表（列表是客户端 SWR 数据，router.refresh 刷不到）

import type { JSX } from "react";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import { deleteRule } from "@/entities/rule";
import { toast } from "@/features/toast";
import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

// 删除前确认：规约被 AGENTS.md 引用后删除会影响引用方，要求手动键入确认
const DELETE_CONFIRM_TEXT = "确认删除规则";

type DeleteDialogProps = {
	// 待删规约（弹窗内展示名称与预览）
	rule: RuleListItemVo;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteDialog({ rule, open, onOpenChange }: DeleteDialogProps): JSX.Element {
	const { mutate } = useSWRConfig();
	// 删除规约 mutation
	const { trigger: triggerDelete, isMutating: isDeleting } = useSWRMutation("delete-rule", () =>
		deleteRule(rule.id),
	);

	// 确认删除：删除成功后重拉列表；失败时 rethrow 让弹窗保持打开供重试
	const handleConfirmDelete = async (): Promise<void> => {
		try {
			await triggerDelete();
			await mutate((key) => Array.isArray(key) && key[0] === "rules");
			toast.success("规约已删除");
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "删除失败");
			throw error;
		}
	};

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
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
	);
}
