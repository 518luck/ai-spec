"use client";

import { type JSX, useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@/shared/ui/combobox";

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

// 文件夹下拉选择框：基于 shadcn Combobox（base-ui）的 popup 模式封装
// 支持选择 / 搜索过滤 / 可选创建新文件夹；数据源由父组件传入，组件不直接拉数据
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
	const [searchValue, setSearchValue] = useState("");

	// 当前选中的 option 对象（Combobox 的 value 接收对象，itemToStringValue 提取比对值）
	const selectedOption = useMemo(
		() => options.find((opt) => opt.value === value) ?? null,
		[options, value],
	);

	// 创建新文件夹：调 onCreate，成功后加进本地列表并自动选中
	const handleCreate = async (): Promise<void> => {
		if (!onCreate || !searchValue.trim()) return;
		const created = await onCreate(searchValue.trim());
		if (created) {
			onChange(created.value);
			setSearchValue("");
		}
	};

	return (
		<Combobox
			items={options}
			itemToStringValue={(opt) => opt.value}
			value={selectedOption}
			onValueChange={(opt) => onChange(opt?.value)}
		>
			<ComboboxTrigger
				render={
					<button
						type="button"
						className={cn(
							"flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-muted",
							"text-muted-foreground data-[popup-open]:bg-muted",
							className,
						)}
					/>
				}
			>
				{selectedOption ? (
					<span className="flex items-center gap-1.5 font-normal text-foreground">
						{selectedOption.icon && <span>{selectedOption.icon}</span>}
						{selectedOption.label}
					</span>
				) : (
					<span>{placeholder}</span>
				)}
			</ComboboxTrigger>

			<ComboboxContent>
				<ComboboxInput
					placeholder={searchPlaceholder}
					value={searchValue}
					onChange={(e) => setSearchValue(e.target.value)}
					showClear
				/>
				<ComboboxList>
					{(option: FolderOption) => (
						<ComboboxItem key={option.value} value={option}>
							{option.icon && <span>{option.icon}</span>}
							{option.label}
						</ComboboxItem>
					)}
				</ComboboxList>
				<ComboboxEmpty>
					{onCreate && searchValue.trim() ? (
						<button
							type="button"
							onClick={handleCreate}
							className="w-full text-left text-sm text-muted-foreground hover:text-foreground"
						>
							创建「{searchValue.trim()}」
						</button>
					) : (
						emptyText
					)}
				</ComboboxEmpty>
			</ComboboxContent>
		</Combobox>
	);
}
