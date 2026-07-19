"use client";

// # 标签多选下拉：chips 水平排列展示已选，末尾「+」按钮打开 Popover 搜索/勾选/内联创建
// > 传 value/onChange 时走受控模式（弹窗用），没传时自动读写 URL ?tagIds=a,b,c（导航栏筛选用）

import { useCommandState } from "cmdk";
import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { createTag, getTags } from "@/entities/tag";
import { CommandScrollMask } from "@/features/command-scroll-mask";
import { toast } from "@/features/toast";
import { useScrollProgress } from "@/shared/hooks";
import { cn } from "@/shared/lib/utils";
import { createTagDtoSchema, type TagOptionVo } from "@/shared/lib/zod/schemas/tag";
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
import { Skeleton } from "@/shared/ui/skeleton";
import { TAG_NEUTRAL_COLOR } from "../config/tag-colors";
import { CreateTagDialog } from "./create-tag-dialog";
import { TagChip } from "./tag-chip";

// URL 参数名：与 folderId 对称的短名风格，不同资源的 tag 筛选在不同页面（不同 URL），不会冲突
const TAG_IDS_PARAM = "tagIds";

type TagComboboxProps = {
	// 标签归属的资源类型（如 "promptRecord"）；仅用于 SWR key 隔离缓存，为将来按资源过滤 tag 列表预留
	resourceType: string;
	// 已选标签（完整对象：编辑回填与 chips 展示都需要 name/color）；传了走受控，没传自动从 URL 读 id 反查
	value?: TagOptionVo[];
	// 选中变化回调：传了走受控，没传自动写入 URL
	onChange?: (tags: TagOptionVo[]) => void;
	// 外层容器 className（控制最大宽度等）
	className?: string;
};

// > 标签多选：chips 展示已选 + 「+」触发 Popover，弹层内搜索/勾选/新建，选中不关弹层可连续选
export function TagCombobox({
	resourceType,
	value: controlledValue,
	onChange: controlledOnChange,
	className,
}: TagComboboxProps): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [open, setOpen] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [createInitialName, setCreateInitialName] = useState("");

	// 标签列表：按 resourceType 拉取当前用户的标签（后端按 ownerId+resourceType 隔离），SWR 托管缓存
	const {
		data: rawTags,
		isLoading,
		mutate: refetchTags,
	} = useSWR(["tags", resourceType], () => getTags(resourceType));
	const allTags = useMemo<TagOptionVo[]>(() => rawTags ?? [], [rawTags]);

	// URL 模式下从 ?tagIds= 解析出 id 列表（用 useMemo 稳定引用，避免每次渲染新建数组）
	const urlTagIds = useMemo(() => {
		if (controlledValue !== undefined) return [];
		const param = searchParams?.get(TAG_IDS_PARAM) ?? "";
		return param
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}, [controlledValue, searchParams]);

	// 实际生效的已选值：受控模式直接用 controlledValue；URL 模式从 allTags 反查出完整对象
	const value = useMemo<TagOptionVo[]>(() => {
		if (controlledValue !== undefined) return controlledValue;
		const idSet = new Set(urlTagIds);
		return allTags.filter((t) => idSet.has(t.id));
	}, [controlledValue, urlTagIds, allTags]);

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

	// onChange 传了走回调，没传改 URL（写回 id 列表）
	const handleChange = useCallback(
		(tags: TagOptionVo[]) => {
			if (controlledOnChange) {
				controlledOnChange(tags);
				return;
			}
			// URL 模式：用 id 列表写回，空则删除参数（保持 URL 干净）
			const params = new URLSearchParams(searchParams?.toString() ?? "");
			if (tags.length > 0) {
				params.set(TAG_IDS_PARAM, tags.map((t) => t.id).join(","));
			} else {
				params.delete(TAG_IDS_PARAM);
			}
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[controlledOnChange, searchParams, router],
	);

	// 切换某个 tag 的选中态：已选则移除，未选则追加
	const toggleTag = useCallback(
		(tag: TagOptionVo) => {
			if (selectedIds.has(tag.id)) {
				handleChange(value.filter((t) => t.id !== tag.id));
			} else {
				handleChange([...value, tag]);
			}
		},
		[value, handleChange, selectedIds],
	);

	// Popover 关闭时同步关闭创建对话框，避免 Dialog 的 open state 残留
	const handlePopoverOpenChange = (next: boolean): void => {
		setOpen(next);
		if (!next) setCreateDialogOpen(false);
	};

	// > 新建标签：全量校验后落库，成功后刷新缓存、自动选中、关闭弹层
	const handleCreate = async (input: { name: string; color: string }): Promise<void> => {
		// 拼上当前组件实例的 resourceType 一起校验（input 来自 CreateTagDialog，只有 name+color）
		const parsed = createTagDtoSchema.safeParse({ ...input, resourceType });
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "创建标签失败");
			return;
		}
		try {
			const created = await createTag(parsed.data);
			await refetchTags();
			handleChange([...value, created]);
			setOpen(false);
			setCreateDialogOpen(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建标签失败");
		}
	};

	return (
		<Popover open={open} onOpenChange={handlePopoverOpenChange}>
			{/* // 触发器：左「过滤」按钮 + 右已选 chips 区，整块容器可点击开 Popover；render 非 button 故关掉 nativeButton */}
			<PopoverTrigger
				nativeButton={false}
				render={
					<div
						className={cn(
							"flex h-9 min-h-9 items-center gap-1 rounded-md border border-input bg-transparent p-0.5 transition-[color,box-shadow]",
							"focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 hover:border-ring/50",
							className,
						)}
					>
						{/* // 左侧「过滤」按钮：filter 图标 + 文本 + 下箭头，纯视觉装饰，点击交给外层 trigger */}
						<span
							className="flex h-8 shrink-0 items-center gap-1 rounded-(calc(var(--radius)-2px)) px-2 text-muted-foreground text-sm"
							aria-hidden
						>
							<Icons.filter2 className="size-4" />
							<span>过滤</span>
							<Icons.chevronDown className="size-4" />
						</span>
						{/* // 右侧已选标签区：空态占位，否则横向排列 chips，溢出滚动 */}
						<div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
							{value.length === 0 ? (
								<span className="text-muted-foreground text-sm">未选择标签</span>
							) : (
								value.map((tag) => (
									<TagChip
										key={tag.id}
										name={tag.name}
										color={tag.color}
										removable
										onRemove={() => handleChange(value.filter((t) => t.id !== tag.id))}
									/>
								))
							)}
						</div>
					</div>
				}
			/>

			<PopoverContent className="w-56 p-0" align="start">
				<Command>
					<CommandInput placeholder="搜索标签..." />
					<div className="relative">
						{/* // scrollbar-thin：macOS 风格透明滚动条（hover 淡入），覆盖 CommandList 默认无效的 no-scrollbar */}
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
						<CommandScrollMask
							scrollProgress={scrollProgress}
							onSearchChange={updateScrollProgress}
						/>
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
