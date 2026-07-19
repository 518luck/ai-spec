"use client";

// # 标签选择面板：搜索 + 勾选 + 内联创建的纯内容组件，不含 Popover/chips/触发器
// > 由外层容器（FilterCombobox、editor-toolbar 等）自行包 Popover 和 chips 展示
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
import { Skeleton } from "@/shared/ui/skeleton";
import { TAG_NEUTRAL_COLOR } from "../config/tag-colors";
import { CreateTagDialog } from "./create-tag-dialog";
import { TagOptionItem } from "./tag-option-item";

// URL 参数名：与 folderId 对称的短名风格，不同资源的 tag 筛选在不同页面（不同 URL），不会冲突
const TAG_IDS_PARAM = "tagIds";

type TagComboboxProps = {
	// 标签归属的资源类型（如 "promptRecord"）；仅用于 SWR key 隔离缓存，为将来按资源过滤 tag 列表预留
	resourceType: string;
	// 已选标签（完整对象：勾选回显需要 name/color）；传了走受控，没传自动从 URL 读 id 反查
	value?: TagOptionVo[];
	// 选中变化回调：传了走受控，没传自动写入 URL
	onChange?: (tags: TagOptionVo[]) => void;
	// 挂载完成回调：外层 Popover 打开后用其触发 SWR 刷新（面板本身不再自管 open）
	onMount?: () => void;
	// 外层 className：默认 w-44，可覆盖宽度
	className?: string;
};

// > 标签选择面板：搜索 + 勾选 + 新建，纯内容组件；选中不关弹层可连续选
export function TagCombobox({
	resourceType,
	value: controlledValue,
	onChange: controlledOnChange,
	onMount,
	className,
}: TagComboboxProps): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();

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

	// 挂载时刷新一次，保证列表新鲜（外层 Popover 每次打开都会重新挂载本面板）
	useEffect(() => {
		void refetchTags();
		onMount?.();
	}, [refetchTags, onMount]);

	// > 重算滚动进度：数据到达时容器可见高度被 max-h 钉死，需双 rAF 跨过布局后再测量
	// biome-ignore lint/correctness/useExhaustiveDependencies: rawTags 作为触发信号，effect body 不读它但需响应其变化
	useEffect(() => {
		const id = requestAnimationFrame(() => {
			requestAnimationFrame(() => updateScrollProgress());
		});
		return () => cancelAnimationFrame(id);
	}, [rawTags, updateScrollProgress]);

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

	// > 新建标签：全量校验后落库，成功后刷新缓存、自动选中、关闭创建对话框
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
			setCreateDialogOpen(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建标签失败");
		}
	};

	return (
		<Command className={cn("w-44", className)}>
			<CommandInput placeholder="搜索标签..." />
			<div className="relative">
				{/* // scrollbar-thin：macOS 风格透明滚动条（hover 淡入），覆盖 CommandList 默认无效的 no-scrollbar */}
				<CommandList
					ref={listRef}
					onScroll={updateScrollProgress}
					className="scrollbar-thin max-h-64"
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
							{allTags.map((tag) => (
								<TagOptionItem
									key={tag.id}
									tag={tag}
									selected={selectedIds.has(tag.id)}
									onSelect={() => toggleTag(tag)}
								/>
							))}
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
								<Icons.tagAdd className="size-4" style={{ color: TAG_NEUTRAL_COLOR }} />
							</span>
							<span>新建标签</span>
						</CommandItem>
					</CommandGroup>
				</CommandList>
				<CommandScrollMask scrollProgress={scrollProgress} onSearchChange={updateScrollProgress} />
			</div>
			<CreateTagDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
				initialName={createInitialName}
				onSubmit={handleCreate}
			/>
		</Command>
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
