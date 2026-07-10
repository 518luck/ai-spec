"use client";

import { useCommandState } from "cmdk";
import { type JSX, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/shared/ui/command";
import { Icons } from "@/shared/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

// 文件夹选项的形状：后端 action 接好后返回这个结构，父组件拼好传入
export type FolderOption = {
	value: string; // folder.id
	label: string; // folder.name
	icon?: string; // folder.icon（emoji 或图标标识，可选）
};

type FolderComboboxProps = {
	// 文件夹列表，由父组件从后端拉取后传入（组件本身不获取数据，保持纯 UI）
	options: FolderOption[];
	// 当前选中的 folder_id；undefined 表示未选中
	value?: string;
	// 选中回调，undefined 表示用户清空了选择
	onChange: (folderId: string | undefined) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	// 可选：创建新文件夹。传入后搜索无结果会显示「创建 xxx」，点击调用它
	onCreate?: (name: string) => Promise<FolderOption | null>;
	className?: string;
};

// 文件夹下拉选择框：用 Popover（定位稳定）+ Command（cmdk，自带搜索过滤/键盘导航）
// 这是 shadcn 官方推荐的 combobox 模式，也是参考项目 dub 的实现方式
export function FolderCombobox({
	options,
	value,
	onChange,
	placeholder = "选择文件夹",
	searchPlaceholder = "搜索文件夹...",
	emptyText = "没有匹配的文件夹",
	onCreate,
	className,
}: FolderComboboxProps): JSX.Element {
	const [open, setOpen] = useState(false);

	const selectedOption = options.find((opt) => opt.value === value);

	// 创建新文件夹：调 onCreate，成功后选中它并关闭弹层
	const handleCreate = async (name: string): Promise<void> => {
		if (!onCreate) return;
		const created = await onCreate(name);
		if (created) {
			onChange(created.value);
			setOpen(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			{/* 触发器：Button 样式，显示当前选中项或占位文案 */}
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className={cn("h-9 justify-between font-normal", className)}
					/>
				}
			>
				{selectedOption ? (
					<span className="flex items-center gap-1.5">
						{selectedOption.icon && <span>{selectedOption.icon}</span>}
						{selectedOption.label}
					</span>
				) : (
					placeholder
				)}
				<Icons.selector className="size-4 shrink-0 opacity-50" />
			</PopoverTrigger>

			{/* 弹层：Popover 负责定位，Command 负责搜索过滤 + 键盘导航 */}
			<PopoverContent className="w-(--anchor-width) p-0" align="start">
				<Command>
					{/* CommandInput：cmdk 自动管过滤（按 CommandItem 的 value 匹配输入） */}
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						{onCreate ? (
							<CommandEmpty>
								<CreateButton onCreate={handleCreate} emptyText={emptyText} />
							</CommandEmpty>
						) : (
							<CommandEmpty>{emptyText}</CommandEmpty>
						)}
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.label}
									onSelect={() => {
										onChange(option.value);
										setOpen(false);
									}}
								>
									{option.icon && <span>{option.icon}</span>}
									{option.label}
									<Icons.check
										className={cn(
											"ml-auto size-4",
											value === option.value ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

/**
 * 搜索无结果时的「创建 xxx」按钮。
 * 拆成子组件是因为 cmdk 的 useCommandState 必须在 Command 上下文内调用，
 * 而且它能拿到当前搜索词（CommandInput 的值）。
 */
function CreateButton({
	onCreate,
	emptyText,
}: {
	onCreate: (name: string) => Promise<void>;
	emptyText: string;
}): JSX.Element {
	// useCommandState 读取 cmdk 内部状态：当前搜索词
	const search = useCommandState((state) => state.search);

	if (!search.trim()) {
		return <span>{emptyText}</span>;
	}

	return (
		<button
			type="button"
			onClick={() => onCreate(search)}
			className="w-full text-left text-muted-foreground hover:text-foreground"
		>
			创建「{search}」
		</button>
	);
}
