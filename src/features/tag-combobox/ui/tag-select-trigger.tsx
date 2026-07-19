"use client";

// # 标签选择触发器：「+」图标按钮 + Popover（内嵌纯面板 TagCombobox）
// > 只负责打开/关闭和面板嵌入，不渲染 chips；chips 由调用方按需自行展示
// > open 受控可选：传了由外层管理（FilterCombobox 需要跨 Popover 切换），没传自动管理

import { type JSX, useCallback, useState } from "react";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { TagCombobox } from "./tag-combobox";

type TagSelectTriggerProps = {
	// 标签归属的资源类型（如 "promptRecord"），透传给内嵌面板
	resourceType: string;
	// 已选标签：透传给内嵌面板
	value?: TagOptionVo[];
	// 选中变化回调：透传给内嵌面板
	onChange?: (tags: TagOptionVo[]) => void;
	// 弹层打开状态：传了走受控，没传自动管理
	open?: boolean;
	// 弹层打开状态变化回调：与 open 配套
	onOpenChange?: (open: boolean) => void;
	// 触发按钮样式（如 ghost/outline、size 等），默认 outline + icon-sm
	triggerVariant?: "outline" | "ghost";
	// PopoverContent 对齐方式，默认 start
	align?: "start" | "center" | "end";
	// 外层 className
	className?: string;
};

// > 标签选择触发器：+ 按钮 → Popover → 内嵌 TagCombobox 面板
export function TagSelectTrigger({
	resourceType,
	value,
	onChange,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	triggerVariant = "outline",
	align = "start",
	className,
}: TagSelectTriggerProps): JSX.Element {
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;
	const setOpen = useCallback(
		(next: boolean) => {
			if (controlledOpen !== undefined) {
				controlledOnOpenChange?.(next);
			} else {
				setInternalOpen(next);
			}
		},
		[controlledOpen, controlledOnOpenChange],
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant={triggerVariant}
						size="icon-sm"
						className="size-7 shrink-0 text-muted-foreground"
						aria-label="选择标签"
					/>
				}
			>
				<Icons.plus className="size-4" />
			</PopoverTrigger>
			<PopoverContent className={`w-56 p-0 ${className ?? ""}`} align={align}>
				<TagCombobox resourceType={resourceType} value={value} onChange={onChange} />
			</PopoverContent>
		</Popover>
	);
}
