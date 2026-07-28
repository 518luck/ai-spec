"use client";

// # 领域空间下拉：拉取当前用户的规约领域空间 + 切换（写 URL ?spaceId=）+ 内联新建
// ! 空间是规约库的顶层隔离，切空间必须清掉 folderId / tagIds——文件夹和标签都出不了空间

import { useCommandState } from "cmdk";
import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useState } from "react";
import useSWR from "swr";

import { createRuleSpace, getRuleSpaces } from "@/entities/rule";
import { toast } from "@/features/toast";
import { cn } from "@/shared/lib/utils";
import { createRuleSpaceDtoSchema } from "@/shared/lib/zod/schemas/rule-space";
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
import { Skeleton } from "@/shared/ui/skeleton";
import { resolveSpaceIcon } from "../config/space-icons";
import { CreateSpaceDialog } from "./create-space-dialog";

// URL 上标记当前空间的查询参数
const SPACE_PARAM = "spaceId";

// 切空间时要一并清掉的筛选参数（都是空间内概念）
const SCOPED_PARAMS = ["folderId", "tagIds"] as const;

type RuleSpaceComboboxProps = {
	className?: string;
};

// > 领域空间下拉：URL 模式（读写 ?spaceId=），列表由 SWR 托管，底部提供新建入口
export function RuleSpaceCombobox({ className }: RuleSpaceComboboxProps): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [open, setOpen] = useState(false);
	// 新建空间对话框：点「新建领域空间」或搜索无结果时打开
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	// 新建对话框预填名称：来自搜索词
	const [createInitialName, setCreateInitialName] = useState("");

	// 空间列表：错误处理与重试由全局 SwrProvider 统一配置
	const { data, isLoading, mutate: refetchSpaces } = useSWR("rule-spaces", getRuleSpaces);
	const spaces = data ?? [];
	// 当前空间：URL 指定优先；URL 没带或指向已删空间时回落列表首个
	const urlSpaceId = searchParams?.get(SPACE_PARAM) ?? null;
	const activeSpace = spaces.find((space) => space.id === urlSpaceId) ?? spaces[0];

	// 切换空间：写入 URL，同时清掉空间内的筛选条件
	const handleSelect = (spaceId: string): void => {
		const params = new URLSearchParams(searchParams?.toString() ?? "");
		params.set(SPACE_PARAM, spaceId);
		for (const param of SCOPED_PARAMS) {
			params.delete(param);
		}
		router.replace(`?${params.toString()}`, { scroll: false });
		setOpen(false);
	};

	// > 新建空间：Dto 全量校验后落库，成功后刷新列表并切到新空间
	const handleCreate = async (input: { name: string; icon: string }): Promise<void> => {
		const parsed = createRuleSpaceDtoSchema.safeParse(input);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "创建空间失败");
			return;
		}
		try {
			const created = await createRuleSpace(parsed.data);
			await refetchSpaces();
			setCreateDialogOpen(false);
			handleSelect(created.id);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建空间失败");
		}
	};

	// Popover 关闭时同步关掉新建对话框，避免 Dialog 的 open state 残留
	const handlePopoverOpenChange = (next: boolean): void => {
		setOpen(next);
		if (!next) setCreateDialogOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={handlePopoverOpenChange}>
			<PopoverTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						role="combobox"
						aria-label={activeSpace?.name ?? "领域空间"}
						title={activeSpace?.name ?? "领域空间"}
						aria-expanded={open}
						className={className}
					/>
				}
			>
				<Icons.domain className="size-4 text-muted-foreground" />
			</PopoverTrigger>

			<PopoverContent className="w-45 p-0" align="start">
				<Command>
					<CommandInput placeholder="搜索空间..." />
					<CommandList className="scrollbar-thin max-h-72">
						<CommandEmpty>
							<CreateSpaceButton
								onSelect={(name) => {
									setCreateInitialName(name);
									setCreateDialogOpen(true);
								}}
							/>
						</CommandEmpty>

						{/* // > 空间列表：首次加载用骨架占位，有缓存后 SWR 直接返回旧数据不闪骨架 */}
						{isLoading ? (
							<CommandGroup>
								{["a", "b"].map((k) => (
									<div key={k} className="flex items-center gap-2 px-2 py-1.5">
										<Skeleton className="size-4 shrink-0 rounded" />
										<Skeleton className="h-4 flex-1" />
									</div>
								))}
							</CommandGroup>
						) : (
							<CommandGroup>
								{spaces.map((space) => (
									<SpaceOptionItem
										key={space.id}
										name={space.name}
										icon={space.icon}
										selected={space.id === activeSpace?.id}
										onSelect={() => handleSelect(space.id)}
									/>
								))}
							</CommandGroup>
						)}

						{/* // > 新建空间：作为列表项放在分组里，和空间列表视觉统一 */}
						<CommandSeparator />
						<CommandGroup>
							<CommandItem
								value="新建领域空间 创建 new space"
								onSelect={() => {
									setCreateInitialName("");
									setCreateDialogOpen(true);
								}}
								className="not-first:mt-2 cursor-pointer bg-transparent! text-muted-foreground hover:bg-accent! hover:text-accent-foreground!"
							>
								<Icons.plus className="size-4 shrink-0" />
								<span className="min-w-0 truncate">新建领域空间</span>
							</CommandItem>
						</CommandGroup>
					</CommandList>

					<CreateSpaceDialog
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

// 空间列表项：图标 + 名称 + 选中勾
function SpaceOptionItem({
	name,
	icon,
	selected,
	onSelect,
}: {
	name: string;
	icon: string;
	selected: boolean;
	onSelect: () => void;
}): JSX.Element {
	const Glyph = resolveSpaceIcon(icon);

	return (
		<CommandItem
			value={name}
			onSelect={onSelect}
			className="not-first:mt-2 cursor-pointer bg-transparent! hover:bg-accent! hover:text-accent-foreground!"
		>
			<Glyph className="size-4 shrink-0 text-muted-foreground" />
			<span className="min-w-0 truncate">{name}</span>
			<Icons.check className={cn("ml-auto size-4", selected ? "opacity-100" : "opacity-0")} />
		</CommandItem>
	);
}

// > 搜索无结果时的「创建 xxx」按钮：拆成子组件是因为 useCommandState 必须在 Command 上下文内调用
function CreateSpaceButton({ onSelect }: { onSelect: (name: string) => void }): JSX.Element {
	const search = useCommandState((state) => state.search);

	if (!search.trim()) {
		return <span className="text-muted-foreground">没有匹配的空间</span>;
	}

	return (
		<button
			type="button"
			onClick={() => onSelect(search)}
			className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground"
		>
			<Icons.plus className="size-4 shrink-0" />
			<span className="min-w-0 truncate">创建 {search}</span>
		</button>
	);
}
