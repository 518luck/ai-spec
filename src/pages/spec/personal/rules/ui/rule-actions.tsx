"use client";

// # 规则行操作入口：「…」按钮触发下拉菜单，含编辑、删除；删除经 ConfirmDialog 二次确认

import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { Rule } from "./page";

// 删除前确认：规约被 AGENTS.md 引用后删除会影响引用方，文案强调需确认
const DELETE_CONFIRM_TEXT = "确认删除规则";

type RuleActionsProps = {
	rule: Rule;
};

export function RuleActions({ rule }: RuleActionsProps): JSX.Element {
	const [deleteOpen, setDeleteOpen] = useState(false);

	const handleEdit = (): void => {
		// TODO: 打开编辑弹窗（EditRuleDialog），回填当前规则的名称、正文、文件夹、标签
	};

	const handleDeleteClick = (): void => {
		setDeleteOpen(true);
	};

	// TODO: 接入删除 action（deleteRuleAction），删除成功后 router.refresh()
	const handleConfirmDelete = async (): Promise<void> => {
		// await executeAsync({ id: rule.id });
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
				confirmText="删除"
				variant="destructive"
				onConfirm={handleConfirmDelete}
				requireConfirmInput={{ expected: DELETE_CONFIRM_TEXT }}
			>
				{/* 待删规则信息卡片：左侧名称，右侧所属文件夹 */}
				<div className="flex items-center gap-3 rounded-md border p-3">
					<span className="w-40 shrink-0 truncate font-medium text-sm">{rule.name}</span>
					<span className="min-w-0 flex-1 truncate text-right text-muted-foreground text-xs">
						{rule.folder}
					</span>
				</div>
			</ConfirmDialog>
		</>
	);
}
