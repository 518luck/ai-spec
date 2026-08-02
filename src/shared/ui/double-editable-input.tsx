"use client";

// # 双击可编辑的输入（DoubleEditableInput）：平时是纯文本（无边框无底色），双击/回车切输入框，失焦/回车提交、Esc 放弃
// > 提取自 rule-editor-form（规约名称），供标题栏/表单等"名称即标题"场景复用

import { type JSX, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type DoubleEditableInputProps = {
	// 当前名称，空串表示还没有（显示 fallback）
	value: string;
	// 提交新名称（失焦或回车），已 trim；空串由调用方决定含义（如交还正文首行接管）
	onCommit: (next: string) => void;
	// 名称为空时显示的兜底文案（页面标题）
	fallback?: string;
	// 编辑态输入框占位
	placeholder?: string;
	// 悬停提示文案
	tooltip?: string;
	// 编辑态 Input 的 className
	inputClassName?: string;
	// 文本态容器 className
	textClassName?: string;
};

// 双击才可编辑的输入：平时一行纯文本，双击/回车切成输入框，失焦/回车提交、Esc 放弃
export function DoubleEditableInput({
	value,
	onCommit,
	fallback = "",
	placeholder,
	tooltip = "双击修改名称",
	inputClassName,
	textClassName,
}: DoubleEditableInputProps): JSX.Element {
	const [isEditing, setIsEditing] = useState(false);
	// 编辑期间的草稿；Esc 直接丢弃不回写
	const [draft, setDraft] = useState(value);
	const inputRef = useRef<HTMLInputElement>(null);

	// 切进编辑态后聚焦并全选，省得用户先手动删一遍旧名字
	useEffect(() => {
		if (!isEditing) return;
		inputRef.current?.focus();
		inputRef.current?.select();
	}, [isEditing]);

	// 进入编辑：以当前名称起草
	const startEditing = (): void => {
		setDraft(value);
		setIsEditing(true);
	};

	// 提交草稿并退出编辑
	const commit = (): void => {
		setIsEditing(false);
		onCommit(draft.trim());
	};

	// 回车提交、Esc 放弃；两者都会让输入框卸载，不会再触发 blur 提交一次
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
		if (e.key === "Enter") commit();
		if (e.key === "Escape") setIsEditing(false);
	};

	if (isEditing) {
		return (
			<Input
				ref={inputRef}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				maxLength={64}
				className={inputClassName}
			/>
		);
	}

	return (
		<div className="flex min-w-0 items-center">
			<Tooltip>
				<TooltipTrigger
					render={
						<button
							type="button"
							onDoubleClick={startEditing}
							onKeyDown={(e) => e.key === "Enter" && startEditing()}
							className={cn("flex min-w-0 cursor-text items-center px-1 text-left", textClassName)}
						/>
					}
				>
					<span className="truncate">{value || fallback}</span>
				</TooltipTrigger>
				<TooltipContent>{tooltip}</TooltipContent>
			</Tooltip>
		</div>
	);
}
