"use client";

import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import type { JSX } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteTokenAction } from "@/shared/lib/ohs/local/appservice/token/delete-token";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";

type TokenActionsProps = {
	id: string;
	name: string;
	partialKey: string;
};

// 密钥行操作入口：「...」按钮触发下拉菜单，含编辑、删除；删除经 ConfirmDialog 二次确认
export function TokenActions({ id, name, partialKey }: TokenActionsProps): JSX.Element {
	const router = useRouter();
	// 确认弹窗的开关状态；点「删除」菜单项时打开
	const [deleteOpen, setDeleteOpen] = useState(false);
	const { executeAsync } = useAction(deleteTokenAction, {
		onSuccess: () => {
			toast.success("已删除");
			router.refresh();
		},
		onError: ({ error }) => {
			toast.error(error.serverError || "删除失败，请稍后重试");
		},
	});

	// 编辑：占位提示，编辑表单后续实现
	const handleEdit = (): void => {
		toast.info(`编辑「${name}」功能即将上线`);
	};

	// 点「删除」菜单项：打开确认弹窗，不直接执行删除
	const handleDeleteClick = (): void => {
		setDeleteOpen(true);
	};

	// 确认弹窗的确认回调：执行删除，返回 Promise 让弹窗显示 loading 直到完成
	const handleConfirmDelete = async (): Promise<void> => {
		await executeAsync({ id });
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
				title={`删除密钥`}
				description="此操作将永久删除该密钥，并立即吊销其对账户的所有访问权限。确定要继续吗？"
				confirmText="删除"
				variant="destructive"
				onConfirm={handleConfirmDelete}
				requireConfirmInput={{ expected: "确认删除密钥" }}
			>
				{/* 待删密钥信息卡片：左侧图标+名称（固定宽度，超出省略号），右侧脱敏密钥 */}
				<div className="flex items-center gap-3 rounded-md border p-3">
					<Icons.key className="size-4 shrink-0 text-muted-foreground" />
					<span className="w-32 shrink-0 truncate font-medium text-sm">{name}</span>
					<code className="min-w-0 flex-1 truncate text-right font-mono text-muted-foreground text-xs">
						{partialKey}
					</code>
				</div>
			</ConfirmDialog>
		</>
	);
}
