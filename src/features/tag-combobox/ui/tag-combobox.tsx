"use client";

// # 标签多选下拉：chips 水平排列展示已选，末尾「+」按钮打开 Popover 搜索/勾选/内联创建

import { useCommandState } from "cmdk";
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { createTag, getTags } from "@/entities/tag";
import { toast } from "@/features/toast";
import { useScrollProgress } from "@/shared/hooks";
import { cn } from "@/shared/lib/utils";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { createTagDtoSchema } from "@/shared/lib/zod/schemas/tag";
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
import { TAG_NEUTRAL_COLOR } from "../config/tag-colors";
import { CreateTagDialog } from "./create-tag-dialog";
import { TagChip } from "./tag-chip";

type TagComboboxProps = {
	// 已选标签（完整对象：编辑回填与 chips 展示都需要 name/color）
	value: TagOptionVo[];
	// 选中变化回调：返回新的完整已选数组
	onChange: (tags: TagOptionVo[]) => void;
	// 外层容器 className（控制最大宽度等）
	className?: string;
};

// > 标签多选：chips 展示已选 + 「+」触发 Popover，弹层内搜索/勾选/新建，选中不关弹层可连续选
export function TagCombobox({ value, onChange, className }: TagComboboxProps): JSX.Element {
	const [open, setOpen] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [createInitialName, setCreateInitialName] = useState("");

	// 全局标签列表（Tag 是共享字典，无 resourceType），SWR 托管缓存
	const { data: rawTags, isLoading, mutate: refetchTags } = useSWR(["tags"], () => getTags());

	const allTags = useMemo<TagOptionVo[]>(() => rawTags ?? [], [rawTags]);

	// 已选 id 集合：快速判断勾选状态
	const selectedIds = useMemo(() => new Set(value.map((t) => t.id)), [value]);

	// 列表滚动容器 ref：驱动 ScrollMask 渐变
	const listRef = useRef<HTMLDivElement>(null);
	const { scrollProgress, updateScrollProgress } = useScrollProgress(listRef);

	// 弹层打开时刷新一次，保证列表新鲜
	useEffect(() => {
		if (open) void refetchTags();
	}, [open, refetchTags]);

	// > 重算滚动进度：弹层打开/数据到达时容器可见高度被 max-h 钉死，需双 rAF 跨过布局后再测量
	// biome-ignore lint/correctness/useExhaustiveDependencies: open/rawTags 作为触发信号，effect body 不读它们但需响应其变化
	useEffect(() => {
		if (!open) return;
		const id = requestAnimationFrame(() => {
			requestAnimationFrame(() => updateScrollProgress());
		});
		return () => cancelAnimationFrame(id);
	}, [open, rawTags, updateScrollProgress]);

	// 切换某个 tag 的选中态：已选则移除，未选则从全局列表里查到完整对象追加
	const toggleTag = useCallback(
		(tag: TagOptionVo) => {
			if (selectedIds.has(tag.id)) {
				onChange(value.filter((t) => t.id !== tag.id));
			} else {
				onChange([...value, tag]);
			}
		},
		[value, onChange, selectedIds],
	);

	// Popover 关闭时同步关闭创建对话框，避免 Dialog 的 open state 残留
	const handlePopoverOpenChange = (next: boolean): void => {
		setOpen(next);
		if (!next) setCreateDialogOpen(false);
	};

	// > 新建标签：全量校验后落库，成功后刷新缓存、自动选中、关闭弹层
	const handleCreate = async (input: { name: string; color: string }): Promise<void> => {
		const parsed = createTagDtoSchema.safeParse(input);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "创建标签失败");
			return;
		}
		try {
			const created = await createTag({ name: parsed.data.name, color: parsed.data.color });
			await refetchTags();
			onChange([...value, created]);
			setOpen(false);
			setCreateDialogOpen(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建标签失败");
		}
	};

	return (
		<Popover open={open} onOpenChange={handlePopoverOpenChange}>
			{/* // 触发器：已选 chips 水平排列 + 末尾「+ 标签」按钮 */}
			<PopoverTrigger
				render={
					<div
						className={cn(
							"flex h-9 min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 transition-[color,box-shadow]",
							"focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 hover:border-ring/50",
							className,
						)}
					>
						{value.length === 0 ? (
							<span className="text-muted-foreground text-sm">添加标签</span>
						) : (
							value.map((tag) => (
								<TagChip
									key={tag.id}
									name={tag.name}
									color={tag.color}
									removable
									onRemove={() => onChange(value.filter((t) => t.id !== tag.id))}
								/>
							))
						)}
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="添加标签"
							className="shrink-0 text-muted-foreground"
						>
							<Icons.plus className="size-4" />
						</Button>
					</div>
				}
			/>

			<PopoverContent className="w-56 p-0" align="start">
				<Command>
					<CommandInput placeholder="搜索标签..." />
					<div className="relative">
						<CommandList
							ref={listRef}
							onScroll={updateScrollProgress}
							className="scrollbar-thin max-h-72"
						>
							<CommandEmpty>
								<CreateButtonOnEmpty
									onSelect={(name) => {
										setCreateInitialName(name);
										setCreateDialogOpen(true);
									}}
								/>
							</CommandEmpty>

							{isLoading ? (
								<CommandGroup>
									{["a", "b", "c"].map((k) => (
										<div key={k} className="flex items-center gap-2 px-2 py-1.5">
											<Skeleton className="size-4 shrink-0 rounded-full" />
											<Skeleton className="h-4 flex-1" />
										</div>
									))}
								</CommandGroup>
							) : allTags.length === 0 ? (
								<CommandGroup>
									<div className="px-2 py-1.5 text-muted-foreground text-sm">
										还没有标签，新建一个吧
									</div>
								</CommandGroup>
							) : (
								<CommandGroup>
									{allTags.map((tag) => {
										const selected = selectedIds.has(tag.id);
										return (
											<CommandItem
												key={tag.id}
												value={tag.name}
												onSelect={() => toggleTag(tag)}
												className="cursor-pointer bg-transparent! hover:bg-accent! hover:text-accent-foreground!"
											>
												<span
													className="size-2 shrink-0 rounded-full"
													style={{ backgroundColor: tag.color }}
													aria-hidden
												/>
												<span className="min-w-0 flex-1 truncate">{tag.name}</span>
												<Icons.check
													className={cn("ml-auto size-4", selected ? "opacity-100" : "opacity-0")}
												/>
											</CommandItem>
										);
									})}
								</CommandGroup>
							)}

							<CommandSeparator />
							<CommandGroup>
								<CommandItem
									value="新建标签 创建 new create"
									onSelect={() => {
										setCreateInitialName("");
										setCreateDialogOpen(true);
									}}
									className="not-first:mt-2 cursor-pointer bg-transparent! text-muted-foreground hover:bg-accent! hover:text-accent-foreground!"
								>
									<span
										className="flex size-7 shrink-0 items-center justify-center rounded-md"
										style={{
											backgroundColor: `color-mix(in srgb, ${TAG_NEUTRAL_COLOR} 15%, transparent)`,
										}}
									>
										<Icons.plus className="size-4" style={{ color: TAG_NEUTRAL_COLOR }} />
									</span>
									<span>新建标签</span>
								</CommandItem>
							</CommandGroup>
						</CommandList>
						<ScrollMask scrollProgress={scrollProgress} />
					</div>
					<CreateTagDialog
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

// > 搜索无结果时的「创建 xxx」按钮；拆成子组件是因为 useCommandState 必须在 Command 上下文内调用
function CreateButtonOnEmpty({ onSelect }: { onSelect: (name: string) => void }): JSX.Element {
	const search = useCommandState((state) => state.search);

	if (!search.trim()) {
		return <span className="text-muted-foreground">没有匹配的标签</span>;
	}

	return (
		<button
			type="button"
			onClick={() => onSelect(search)}
			className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground"
		>
			<span
				className="flex size-7 shrink-0 items-center justify-center rounded-md"
				style={{ backgroundColor: `color-mix(in srgb, ${TAG_NEUTRAL_COLOR} 15%, transparent)` }}
			>
				<Icons.plus className="size-4" style={{ color: TAG_NEUTRAL_COLOR }} />
			</span>
			<span className="min-w-0 truncate">创建 {search}</span>
		</button>
	);
}
