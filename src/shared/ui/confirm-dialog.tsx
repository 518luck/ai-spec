"use client";

import type { JSX, ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

// 输入确认配置：启用后用户必须键入 expected 字符串，确认按钮才可点
type RequireConfirmInput = {
	// 必须输入的通关词（如"确认删除密钥"）；同时也作为提示文案的高亮关键词
	expected: string;
	placeholder?: string;
};

type ConfirmDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: ReactNode;
	confirmText?: string;
	// 确认按钮风格；destructive 用于删除等危险操作
	variant?: "default" | "destructive";
	// 确认回调；支持 async，执行期间按钮显示 loading，resolve 后才关闭弹窗
	onConfirm: () => unknown | Promise<unknown>;
	// 自定义内容区，放在标题描述与底部之间
	children?: ReactNode;
	// 可选：要求输入指定文字才能确认，防止误操作高危动作
	requireConfirmInput?: RequireConfirmInput;
};

// 通用二次确认弹窗：受控开关，支持异步 loading、危险操作样式、输入确认文字校验
// 核心时序：点确认 → loading（弹窗不关）→ onConfirm resolve → 关闭，避免「先关弹窗后刷新」的列表闪烁
export function ConfirmDialog({
	open, // 受控开关状态
	onOpenChange, // 开关回调
	title, // 标题
	description, // 描述（可选）
	confirmText = "确认", // 确认按钮文案
	variant = "default", // 确认按钮风格；destructive 用于危险操作
	onConfirm, // 确认回调；支持 async，resolve 后才关闭弹窗
	children, // 自定义内容区，位于描述与底部之间
	requireConfirmInput, // 可选：要求输入指定文字才能确认
}: ConfirmDialogProps): JSX.Element {
	// 输入框当前值；关闭弹窗时重置，避免下次打开残留
	const [inputValue, setInputValue] = useState("");
	// onConfirm 执行中的加载态，期间确认按钮 disabled + 显示「处理中...」
	const [isPending, setIsPending] = useState(false);

	// 是否满足确认条件：未启用输入确认时恒为 true；启用后需输入值等于 expected
	const canConfirm = requireConfirmInput
		? inputValue.trim() === requireConfirmInput.expected
		: true;

	// 点确认：先 await onConfirm，成功后才关闭弹窗，确保列表刷新完成后再消失
	const handleConfirm = async (): Promise<void> => {
		if (!canConfirm || isPending) return;
		setIsPending(true);
		try {
			await onConfirm();
			onOpenChange(false);
		} finally {
			setIsPending(false);
		}
	};

	// 关闭时重置输入框，避免下次打开残留上次输入
	const handleOpenChange = (next: boolean): void => {
		if (isPending) return; // 执行中禁止关闭，防止中断异步操作
		if (!next) setInputValue("");
		onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle className="text-lg">{title}</DialogTitle>
					{description ? <DialogDescription>{description}</DialogDescription> : null}
				</DialogHeader>

				{/* 内容区：bg-muted 与底部同色，形成 header(白)→内容(深)→footer(深) 的层次 */}
				<div className="flex flex-col gap-4 bg-muted px-6 py-4">
					{children}

					{requireConfirmInput ? (
						<div className="flex flex-col gap-2">
							<p className="flex items-baseline gap-1 text-muted-foreground text-sm leading-relaxed">
								<span className="select-none">为确保是本人操作，请在下方输入</span>
								<span className="font-medium text-foreground">{requireConfirmInput.expected}</span>
							</p>
							<Input
								value={inputValue}
								onChange={(event) => setInputValue(event.target.value)}
								placeholder={requireConfirmInput.placeholder}
								aria-invalid={!canConfirm && inputValue.length > 0}
								disabled={isPending}
								autoComplete="off"
							/>
						</div>
					) : null}
				</div>

				<DialogFooter>
					<Button
						className="w-full"
						variant={variant}
						disabled={!canConfirm || isPending}
						onClick={handleConfirm}
						aria-busy={isPending}
					>
						{isPending ? "处理中..." : confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
