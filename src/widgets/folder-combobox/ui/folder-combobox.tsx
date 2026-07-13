"use client";

// # 文件夹下拉选择框：按 resourceType 拉取列表 + 搜索/选中/内联创建（全量校验落库）

import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createFolder, getFolders } from "@/entities/folder/api/folder";
import { useScrollProgress } from "@/shared/hooks";
import { cn } from "@/shared/lib/utils";
import { createFolderDtoSchema } from "@/shared/lib/zod/schemas/folder";
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
import { CreateButton, CreateFolderItemContent } from "./folder-create-items";
import { FolderIcon } from "./folder-icon";
import { FolderOptionItem } from "./folder-option-item";

// 文件夹选项的形状：后端 action 接好后返回这个结构
export type FolderOption = {
	value: string; // folder.id
	label: string; // folder.name
	color?: string; // 文件夹颜色值（hex），驱动 FolderIcon 底色
};

type FolderComboboxProps = {
	// 文件夹归属的资源类型（如 "promptDraft"），决定拉取哪类文件夹 + 创建时归属
	resourceType: string;
	// 当前选中的 folder_id；传了走受控模式，没传自动从 URL ?folder=xxx 读写
	value?: string;
	// 选中回调；传了走受控模式，没传自动写入 URL
	onChange?: (folderId: string | undefined) => void;
	// 图标模式：只显示图标不显示文字，hover 时 Tooltip 显示文件夹名
	iconOnly?: boolean;
	className?: string;
};

// 文件夹下拉选择框：Popover 定位 + Command(cmdk) 搜索过滤 + 内联创建（全量校验后落库）
// > 传 value/onChange 时走受控模式（弹窗用），没传时自动读写 URL ?folder=xxx（导航栏筛选用）
export function FolderCombobox({
	resourceType,
	value: controlledValue,
	onChange: controlledOnChange,
	iconOnly = false,
	className,
}: FolderComboboxProps): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();

	// value 传了用受控，没传从 URL 读
	const value = controlledValue ?? searchParams?.get("folder") ?? undefined;
	// onChange 传了走回调，没传改 URL
	const handleChange = useCallback(
		(folderId: string | undefined) => {
			if (controlledOnChange) {
				controlledOnChange(folderId);
			} else {
				const params = new URLSearchParams(searchParams?.toString() ?? "");
				if (folderId) params.set("folder", folderId);
				else params.delete("folder");
				router.replace(`?${params.toString()}`, { scroll: false });
			}
		},
		[controlledOnChange, searchParams, router],
	);
	const [open, setOpen] = useState(false);
	// 创建文件夹对话框：点击「新建文件夹」列表项或搜索无结果时打开
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	// 创建对话框预填名称：来自搜索词，点击「新建文件夹」列表项时清空
	const [createInitialName, setCreateInitialName] = useState("");
	// 文件夹列表：按 resourceType 拉取
	const [folders, setFolders] = useState<FolderOption[]>([]);
	// 列表滚动容器 ref：驱动 useScrollProgress 算进度，底部接 ScrollMask 渐变遮罩
	const listRef = useRef<HTMLDivElement>(null);
	const { scrollProgress, updateScrollProgress } = useScrollProgress(listRef);

	// 拉取文件夹列表：弹层打开时拉，API 返回 id/name，映射成 UI 层的 value/label
	useEffect(() => {
		if (!open) return;
		void getFolders(resourceType)
			.then((data) =>
				setFolders(data.map((f) => ({ value: f.id, label: f.name, color: f.color ?? undefined }))),
			)
			.catch(() => {
				// 拉取失败静默处理，文件夹选择仍可用（只是列表为空）
			});
	}, [resourceType, open]);

	const selectedOption = folders.find((opt) => opt.value === value);

	// > 创建文件夹：全量 Dto schema 校验（含 resource_type），成功后追加到列表、选中并关闭弹层
	const handleCreate = async (input: {
		name: string;
		description?: string;
		color?: string;
	}): Promise<void> => {
		const parsed = createFolderDtoSchema.safeParse({
			...input,
			resource_type: resourceType,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "创建文件夹失败");
			return;
		}
		try {
			const created = await createFolder({
				name: parsed.data.name,
				description: parsed.data.description,
				color: parsed.data.color ?? undefined,
				resourceType: parsed.data.resource_type,
			});
			setFolders((prev) => [
				...prev,
				{ value: created.id, label: created.name, color: created.color ?? undefined },
			]);
			handleChange(created.id);
			setOpen(false);
			setCreateDialogOpen(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建文件夹失败");
		}
	};

	// Popover 关闭时同步关闭创建对话框，避免 Dialog 的 open state 残留
	const handlePopoverOpenChange = (next: boolean): void => {
		setOpen(next);
		if (!next) setCreateDialogOpen(false);
	};

	// 触发器标签文案
	const triggerLabel = selectedOption ? selectedOption.label : "未分类";

	return (
		<Popover open={open} onOpenChange={handlePopoverOpenChange}>
			{/* // 触发器：iconOnly 时只显示图标 + Tooltip，否则显示完整文字 */}
			{iconOnly ? (
				<IconOnlyTrigger
					iconColor={selectedOption?.color}
					label={triggerLabel}
					open={open}
					className={className}
				/>
			) : (
				<FullTrigger
					iconColor={selectedOption?.color}
					label={triggerLabel}
					hasSelection={Boolean(selectedOption)}
					open={open}
					className={className}
				/>
			)}

			{/* // 弹层：Popover 负责定位，Command 负责搜索过滤 + 键盘导航 */}
			<PopoverContent className="w-45 p-0" align="start">
				<Command>
					{/* CommandInput：cmdk 自动管过滤（按 CommandItem 的 value 匹配输入） */}
					<CommandInput placeholder="搜索文件夹..." />
					<div className="relative">
						<CommandList
							ref={listRef}
							onScroll={updateScrollProgress}
							className="scrollbar-thin max-h-72"
						>
							<CommandEmpty>
								<CreateButton
									onSelect={(name) => {
										setCreateInitialName(name);
										setCreateDialogOpen(true);
									}}
								/>
							</CommandEmpty>
							{/* // > 不加入任何文件夹（folder_id=null），始终置顶；value 含多关键词便于搜索命中 */}
							<CommandGroup>
								<CommandItem
									value="未分类 无文件夹 不加入 none"
									onSelect={() => {
										handleChange(undefined);
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
								{folders.map((option) => (
									<FolderOptionItem
										key={option.value}
										option={option}
										selected={value === option.value}
										onSelect={() => {
											handleChange(option.value);
											setOpen(false);
										}}
									/>
								))}
							</CommandGroup>

							{/* // > 新建文件夹：作为列表项放在分组里，和文件夹列表视觉统一 */}
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
						</CommandList>
						{/* // > 底部渐变遮罩：滚到底自动淡出，提示下方还有更多内容 */}
						<ScrollMask scrollProgress={scrollProgress} />
					</div>
					<CreateFolderDialog
						open={createDialogOpen}
						onOpenChange={setCreateDialogOpen}
						initialName={createInitialName}
						onSubmit={handleCreate}
					/>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

// > 图标模式触发器：只显示图标，hover 时 Tooltip 显示文件夹名
function IconOnlyTrigger({
	iconColor,
	label,
	open,
	className,
}: {
	iconColor?: string;
	label: string;
	open: boolean;
	className?: string;
}): JSX.Element {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<PopoverTrigger
						render={
							<Button
								variant="ghost"
								role="combobox"
								aria-expanded={open}
								className={cn("flex h-8 shrink-0 p-0", className)}
							/>
						}
					/>
				}
			>
				<FolderIcon color={iconColor} />
			</TooltipTrigger>
			<TooltipContent showArrow={false}>{label}</TooltipContent>
		</Tooltip>
	);
}

// > 完整模式触发器：图标 + 文字 + 箭头
function FullTrigger({
	iconColor,
	label,
	hasSelection,
	open,
	className,
}: {
	iconColor?: string;
	label: string;
	hasSelection: boolean;
	open: boolean;
	className?: string;
}): JSX.Element {
	return (
		<PopoverTrigger
			render={
				<Button
					variant="ghost"
					role="combobox"
					aria-expanded={open}
					className={cn("flex h-8 w-45 shrink-0 justify-start gap-1.5 px-2 font-normal", className)}
				/>
			}
		>
			<FolderIcon color={iconColor} />
			<span className={cn("min-w-0 truncate", !hasSelection && "text-muted-foreground")}>
				{label}
			</span>
			<Icons.selector className="size-3.5 opacity-50" />
		</PopoverTrigger>
	);
}
