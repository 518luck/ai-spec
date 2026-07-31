"use client";

// # 删除规约二次确认弹窗：表格行「…」菜单与卡片删除按钮共用
// > 删完用 TanStack Query 按统一前缀 ruleKeys.all 失效所有规约查询（detail+list+infinite 一次性覆盖）

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { JSX } from "react";
import { toast } from "@/features/toast";
import { ruleKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

// 删除前确认：规约被 AGENTS.md 引用后删除会影响引用方，要求手动键入确认
const DELETE_CONFIRM_TEXT = "确认删除规则";

type DeleteRuleDialogProps = {
	// 待删规约（弹窗内展示名称与预览）
	rule: RuleListItemVo;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteRuleDialog({ rule, open, onOpenChange }: DeleteRuleDialogProps): JSX.Element {
	const qc = useQueryClient();
	// 删除规约 mutation：成功后失效全部规约查询，失败显式 toast
	const { mutateAsync: triggerDelete, isPending: isDeleting } = useMutation({
		...orpc.rules.delete.mutationOptions(),
		onSuccess: () => qc.invalidateQueries({ queryKey: ruleKeys.all }),
	});

	// 确认删除：删除成功后提示；失败时显式 toast 并 rethrow 让弹窗保持打开供重试
	const handleConfirmDelete = async (): Promise<void> => {
		try {
			await triggerDelete({ id: rule.id });
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
