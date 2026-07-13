"use client";

// # 文件夹下拉选择框：Popover + Command(cmdk) 组合的 combobox，支持搜索、选中、内联创建

import { useCommandState } from "cmdk";
import { type JSX, useRef, useState } from "react";

import { useScrollProgress } from "@/shared/hooks";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/shared/ui/command";
import { Icons } from "@/shared/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ScrollMask } from "@/shared/ui/scroll-mask";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { CreateFolderDialog } from "./create-folder-dialog";
import { FolderIcon } from "./folder-icon";

// 文件夹选项的形状：后端 action 接好后返回这个结构，父组件拼好传入
export type FolderOption = {
	value: string; // folder.id
	label: string; // folder.name
	color?: string; // 文件夹颜色值（hex 或颜色标识），驱动 FolderIcon 底色
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
	// 可选：创建新文件夹。传入后列表显示「新建文件夹」入口，搜索无结果显示「创建 xxx」
	onCreate?: (input: {
		name: string;
		description?: string;
		color?: string;
	}) => Promise<FolderOption | null>;
	className?: string;
};

// 文件夹下拉选择框：shadcn 官方推荐的 combobox 模式，Popover 定位 + Command(cmdk) 搜索过滤/键盘导航
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
	// 创建文件夹对话框：点击「新建文件夹」列表项或搜索无结果时打开
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	// 创建对话框预填名称：来自搜索词，点击「新建文件夹」列表项时清空
	const [createInitialName, setCreateInitialName] = useState("");
	// 列表滚动容器 ref：驱动 useScrollProgress 算进度，底部接 ScrollMask 渐变遮罩
	const listRef = useRef<HTMLDivElement>(null);
	const { scrollProgress, updateScrollProgress } = useScrollProgress(listRef);

	const selectedOption = options.find((opt) => opt.value === value);

	// 创建新文件夹：调 onCreate，成功后选中它并关闭弹层
	const handleCreate = async (input: {
		name: string;
		description?: string;
		color?: string;
	}): Promise<void> => {
		if (!onCreate) return;
		const created = await onCreate(input);
		if (created) {
			onChange(created.value);
			setOpen(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			{/* // 触发器：ghost 按钮样式，融入标题栏；文件夹图标 + 文字 + 箭头都在按钮内 */}
			<PopoverTrigger
				render={
					<Button
						variant="ghost"
						role="combobox"
						aria-expanded={open}
						className={cn("h-8 max-w-60 gap-1.5 px-2 font-normal", className)}
					/>
				}
			>
				<FolderIcon color={selectedOption?.color} />
				{selectedOption ? (
					<span className="min-w-0 truncate">{selectedOption.label}</span>
				) : (
					<span className="min-w-0 truncate text-muted-foreground">{placeholder}</span>
				)}
				<Icons.selector className="size-3.5 opacity-50" />
			</PopoverTrigger>

			{/* // 弹层：Popover 负责定位，Command 负责搜索过滤 + 键盘导航 */}
			<PopoverContent className="w-(--anchor-width) p-0" align="start">
				<Command>
					{/* CommandInput：cmdk 自动管过滤（按 CommandItem 的 value 匹配输入） */}
					<CommandInput placeholder={searchPlaceholder} />
					<div className="relative">
						<CommandList
							ref={listRef}
							onScroll={updateScrollProgress}
							className="scrollbar-thin max-h-72"
						>
							{onCreate ? (
								<CommandEmpty>
									<CreateButton
										onSelect={(name) => {
											setCreateInitialName(name);
											setCreateDialogOpen(true);
										}}
										emptyText={emptyText}
									/>
								</CommandEmpty>
							) : (
								<CommandEmpty>{emptyText}</CommandEmpty>
							)}
							{/* // > 不加入任何文件夹（folder_id=null），始终置顶；value 含多关键词便于搜索命中 */}
							<CommandGroup>
								<CommandItem
									value="未分类 无文件夹 不加入 none"
									onSelect={() => {
										onChange(undefined);
										setOpen(false);
									}}
									className="cursor-pointer bg-transparent! hover:bg-accent! hover:text-accent-foreground!"
								>
									<FolderIcon icon={Icons.folderX} />
									<span className="text-muted-foreground">未分类</span>
									<Icons.check
										className={cn(
											"ml-auto size-4",
											value === undefined ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							</CommandGroup>
							<CommandSeparator />

							{/* // > 文件夹列表 */}
							<CommandGroup>
								{options.map((option) => (
									<FolderOptionItem
										key={option.value}
										option={option}
										selected={value === option.value}
										onSelect={() => {
											onChange(option.value);
											setOpen(false);
										}}
									/>
								))}
							</CommandGroup>

							{/* // > 新建文件夹：作为列表项放在分组里，和文件夹列表视觉统一；onSelect 不关闭弹层，打开创建对话框 */}
							{onCreate && (
								<>
									<CommandSeparator />
									<CommandGroup>
										<CommandItem
											value="新建文件夹 创建 new create"
											onSelect={() => {
												setCreateInitialName("");
												setCreateDialogOpen(true);
											}}
											className="not-first:mt-2 cursor-pointer bg-transparent! text-muted-foreground hover:bg-accent! hover:text-accent-foreground!"
										>
											<CreateFolderItemContent label="新建文件夹" />
										</CommandItem>
									</CommandGroup>
								</>
							)}
						</CommandList>
						{/* // > 底部渐变遮罩：滚到底自动淡出，提示下方还有更多内容 */}
						<ScrollMask scrollProgress={scrollProgress} />
					</div>
					{onCreate && (
						<CreateFolderDialog
							open={createDialogOpen}
							onOpenChange={setCreateDialogOpen}
							initialName={createInitialName}
							onSubmit={handleCreate}
						/>
					)}
				</Command>
			</PopoverContent>
		</Popover>
	);
}

// > 文件夹列表项：文字被截断时才显示 Tooltip（hover 看全名），没截断不显示
// > 溢出检测：mouseenter 时比较 scrollWidth 和 clientWidth，截断才开 Tooltip
function FolderOptionItem({
	option,
	selected,
	onSelect,
}: {
	option: FolderOption;
	selected: boolean;
	onSelect: () => void;
}): JSX.Element {
	const labelRef = useRef<HTMLSpanElement>(null);
	const [truncated, setTruncated] = useState(false);

	// hover 时检测文字是否溢出：scrollWidth > clientWidth 说明被 truncate 了
	const handleMouseEnter = (): void => {
		const el = labelRef.current;
		if (el) setTruncated(el.scrollWidth > el.clientWidth);
	};

	// 文件夹项内容：图标 + 文字 + 选中标记，CommandItem 和 TooltipTrigger 复用
	const content = (
		<>
			<FolderIcon color={option.color} />
			<span ref={labelRef} className="min-w-0 truncate">
				{option.label}
			</span>
			<Icons.check className={cn("ml-auto size-4", selected ? "opacity-100" : "opacity-0")} />
		</>
	);

	const itemClassName =
		"not-first:mt-2 cursor-pointer bg-transparent! hover:bg-accent! hover:text-accent-foreground!";

	// 截断时用 Tooltip 包裹（hover 显示全名），没截断直接渲染 CommandItem
	if (!truncated) {
		return (
			<CommandItem
				value={option.label}
				onSelect={onSelect}
				onMouseEnter={handleMouseEnter}
				className={itemClassName}
			>
				{content}
			</CommandItem>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<CommandItem
						value={option.label}
						onSelect={onSelect}
						onMouseEnter={handleMouseEnter}
						className={itemClassName}
					/>
				}
			>
				{content}
			</TooltipTrigger>
			<TooltipContent showArrow={false} side="right" align="center">
				{option.label}
			</TooltipContent>
		</Tooltip>
	);
}

// > 创建文件夹项的公共内容：图标 + 文字，供 CommandItem 和 CreateButton 复用
function CreateFolderItemContent({ label }: { label: string }): JSX.Element {
	return (
		<>
			<FolderIcon icon={Icons.folderPlus} />
			<span className="min-w-0 truncate">{label}</span>
		</>
	);
}

// > 搜索无结果时的「创建 xxx」按钮；拆成子组件是因为 useCommandState 必须在 Command 上下文内调用，且能拿到当前搜索词
// > 点击打开 Dialog 并预填搜索词
function CreateButton({
	onSelect,
	emptyText,
}: {
	onSelect: (name: string) => void;
	emptyText: string;
}): JSX.Element {
	const search = useCommandState((state) => state.search);

	if (!search.trim()) {
		return <span className="text-muted-foreground">{emptyText}</span>;
	}

	return (
		<button
			type="button"
			onClick={() => onSelect(search)}
			className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground"
		>
			<CreateFolderItemContent label={`创建 ${search}`} />
		</button>
	);
}
