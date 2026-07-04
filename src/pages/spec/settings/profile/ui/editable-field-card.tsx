"use client";

import type { JSX, KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Card, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

type EditableFieldCardProps = {
	title: string;
	defaultValue?: string;
	placeholder?: string;
	description?: ReactNode;
	aside?: ReactNode;
	disabled?: boolean;
	onSave?: (value: string) => Promise<void>;
	// 成功 toast 文案，默认"已保存"
	successMessage?: string;
	// 成功后回退输入到基线而非推进基线（用于"提交后待处理"，如邮箱变更待验证）
	revertOnSuccess?: boolean;
};

// 自包含的可编辑字段卡片：内部托管输入值、dirty 判定与保存状态，调用方只需传初值与可选保存方法
export function EditableFieldCard({
	title,
	defaultValue = "",
	placeholder,
	description,
	aside,
	disabled = false,
	onSave,
	successMessage = "已保存",
	revertOnSuccess = false,
}: EditableFieldCardProps): JSX.Element {
	// 输入当前值、已保存基线、保存中标志共同表达 idle/dirty/saving 三态
	const [value, setValue] = useState(defaultValue);
	const [baseline, setBaseline] = useState(defaultValue);
	const [isSaving, setIsSaving] = useState(false);
	const dirty = value !== baseline;

	// 调用注入的保存方法，成功则推进基线并用 Sonner 反馈，失败保留 dirty 以便重试
	const handleSave = async (): Promise<void> => {
		if (!onSave || !dirty || isSaving) {
			return;
		}
		setIsSaving(true);
		try {
			await onSave(value.trim());
			// 提交后待处理的场景（如邮箱待验证）回退输入，否则推进基线固化新值
			if (revertOnSuccess) {
				setValue(baseline);
			} else {
				setBaseline(value.trim());
			}
			toast.success(successMessage);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "保存失败");
		} finally {
			setIsSaving(false);
		}
	};

	// Enter 触发保存，Esc 回退到基线
	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
		if (event.key === "Enter" && onSave && dirty && !isSaving) {
			event.preventDefault();
			void handleSave();
		} else if (event.key === "Escape") {
			setValue(baseline);
		}
	};

	return (
		<Card className="gap-0 py-0">
			<div className="flex items-center gap-(--card-spacing) px-(--card-spacing) pt-3 pb-(--card-spacing)">
				<div className="flex flex-1 flex-col gap-(--card-spacing)">
					<CardTitle>{title}</CardTitle>
					<Input
						className="max-w-lg"
						value={value}
						placeholder={placeholder}
						disabled={disabled || isSaving}
						onChange={(event) => setValue(event.target.value)}
						onKeyDown={handleKeyDown}
					/>
				</div>
				{aside ? <div className="flex shrink-0 items-center self-stretch">{aside}</div> : null}
			</div>
			<div className="flex items-center justify-between gap-2 border-border border-t bg-muted px-(--card-spacing) py-2 text-muted-foreground text-xs">
				<span className="line-clamp-1">{description}</span>
				{onSave ? (
					<Button
						type="button"
						size="xs"
						disabled={!dirty || isSaving}
						onClick={() => void handleSave()}
					>
						{isSaving ? "保存中…" : "保存"}
					</Button>
				) : null}
			</div>
		</Card>
	);
}
