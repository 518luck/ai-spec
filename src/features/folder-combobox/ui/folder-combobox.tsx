"use client";

// # 文件夹下拉选择框：按 resourceType 拉取列表 + 搜索/选中/内联创建（全量校验落库）

import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { createFolder, getFolders } from "@/entities/folder/api/folder";
import { toast } from "@/features/toast";
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
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { FOLDER_NEUTRAL_COLOR } from "../config/folder-colors";
import { CreateFolderDialog } from "./create-folder-dialog";
import { CreateButton, CreateFolderItemContent } from "./folder-create-items";
import { FolderIcon } from "./folder-icon";
import { FolderOptionItem } from "./folder-option-item";

// 文件夹选项的形状：后端 action 接好后返回这个结构
export type FolderOption = {
	value: string; // folder.id
	label: string; // folder.name
	color: string; // 文件夹颜色值（#RRGGBB），驱动 FolderIcon 底色
};

type FolderComboboxProps = {
	// 文件夹归属的资源类型（如 "promptDraft"），决定拉取哪类文件夹 + 创建时归属
	resourceType: string;
	// 当前选中的 folderId；传了（含 null = 未分类）走受控模式，没传自动从 URL ?folder=xxx 读写
	value?: string | null;
	// 选中回调；传了走受控模式，没传自动写入 URL
	onChange?: (folderId: string | null) => void;
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

	// value 传了（含 null）用受控，没传从 URL 读
	const value = controlledValue ?? searchParams?.get("folderId") ?? null;
	// onChange 传了走回调，没传改 URL
	const handleChange = useCallback(
		(folderId: string | null) => {
			if (controlledOnChange) {
				controlledOnChange(folderId);
			} else {
				const params = new URLSearchParams(searchParams?.toString() ?? "");
				if (folderId) params.set("folderId", folderId);
				else params.delete("folderId");
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
	// 文件夹列表：按 resourceType 拉取，由 SWR 托管缓存（key 变化自动重拉）
	// 错误处理、失焦/重试策略由全局 SwrProvider 统一配置，这里无需重复
	// ? 未来扩展：文件夹数量超过阈值（如 50）时，参考 Dub 的 folder-dropdown 智能切换模式——
	// ? 检测超阈值后关闭 cmdk 内存过滤（shouldFilter={false}），改用后端搜索（getFolders 加 q 参数）+ useDebounce(300ms) 防抖
	const {
		data: rawFolders,
		isLoading,
		mutate: refetchFolders,
	} = useSWR(["folders", resourceType], ([, type]) => getFolders(type));
	// 后端 VO 映射为下拉选项；rawFolders 为 undefined 时回退空数组
	const folders = useMemo<FolderOption[]>(
		() => (rawFolders ?? []).map((f) => ({ value: f.id, label: f.name, color: f.color })),
		[rawFolders],
	);
	// 列表滚动容器 ref：驱动 useScrollProgress 算进度，底部接 ScrollMask 渐变遮罩
	const listRef = useRef<HTMLDivElement>(null);
	const { scrollProgress, updateScrollProgress } = useScrollProgress(listRef);

	// 弹层打开时刷新一次，保证列表新鲜
	useEffect(() => {
		if (open) void refetchFolders();
	}, [open, refetchFolders]);

	// > 重算滚动进度：弹层打开/数据到达时，容器可见高度被 max-h-72 钉死（ResizeObserver 失效），
	// > 且 cmdk 的 item 注册晚于本 effect（同步读 scrollHeight 拿到未撑开的值），需双 rAF 跨过布局后再测量
	// biome-ignore lint/correctness/useExhaustiveDependencies: open/rawFolders 作为触发信号，effect body 不读它们但需响应其变化
	useEffect(() => {
		if (!open) return;
		const id = requestAnimationFrame(() => {
			requestAnimationFrame(() => updateScrollProgress());
		});
		return () => cancelAnimationFrame(id);
	}, [open, rawFolders, updateScrollProgress]);

	const selectedOption = folders.find((opt) => opt.value === value);

	// > 创建文件夹：全量 Dto schema 校验（含 resourceType），成功后追加到列表、选中并关闭弹层
	const handleCreate = async (input: {
		name: string;
		description?: string;
		color: string;
	}): Promise<void> => {
		const parsed = createFolderDtoSchema.safeParse({
			...input,
			resourceType,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "创建文件夹失败");
			return;
		}
		try {
			const created = await createFolder({
				name: parsed.data.name,
				description: parsed.data.description,
				color: parsed.data.color,
				resourceType: parsed.data.resourceType,
			});
			// 创建成功后刷新缓存（替代手动 setFolders），让新文件夹出现在列表里
			await refetchFolders();
			// 自动选中新文件夹：受控模式走 onChange 回调，URL 模式走 router.replace
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

	// 触发器标签文案与图标颜色：未选中时给中性灰
	const triggerLabel = selectedOption ? selectedOption.label : "未分类";
	const triggerColor = selectedOption?.color ?? FOLDER_NEUTRAL_COLOR;

	return (
		<Popover open={open} onOpenChange={handlePopoverOpenChange}>
			{/* // 触发器：iconOnly 时只显示图标 + Tooltip，否则显示完整文字 */}
			{iconOnly ? (
				<IconOnlyTrigger
					iconColor={triggerColor}
					label={triggerLabel}
					open={open}
					className={className}
				/>
			) : (
				<FullTrigger
					iconColor={triggerColor}
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
							{/* // > 不加入任何文件夹（folderId=null），始终置顶；value 含多关键词便于搜索命中 */}
							<CommandGroup>
								<CommandItem
									value="未分类 无文件夹 不加入 none"
									onSelect={() => {
										handleChange(null);
										setOpen(false);
									}}
									className="cursor-pointer bg-transparent! hover:bg-accent! hover:text-accent-foreground!"
								>
									<FolderIcon color={FOLDER_NEUTRAL_COLOR} icon={Icons.folderX} />
									<span className="text-muted-foreground">未分类</span>
									<Icons.check
										className={cn("ml-auto size-4", value === null ? "opacity-100" : "opacity-0")}
									/>
								</CommandItem>
							</CommandGroup>
							<CommandSeparator />

							{/* // > 文件夹列表：首次加载中用骨架占位，有缓存后 SWR 直接返回旧数据不闪骨架 */}
							{isLoading ? (
								<CommandGroup>
									{["a", "b", "c"].map((k) => (
										<div key={k} className="flex items-center gap-2 px-2 py-1.5">
											<Skeleton className="size-4 shrink-0 rounded" />
											<Skeleton className="h-4 flex-1" />
										</div>
									))}
								</CommandGroup>
							) : (
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
							)}

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
	iconColor: string;
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
	iconColor: string;
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
