"use client";

// # 草稿复用级联选择器：左侧选择资源类型，右侧选择该资源的归纳方式（文件夹/标签）

import { type JSX, useState } from "react";
import useSWRMutation from "swr/mutation";
import { getDraft } from "@/entities/prompt";
import { createRecord } from "@/entities/prompt/records/api/create-record";
import { FolderCombobox } from "@/features/folder-combobox";
import { TagSelectTrigger } from "@/features/tag-combobox/ui/tag-select-trigger";
import { toast } from "@/features/toast";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ScrollArea } from "@/shared/ui/scroll-area";

// 资源类型选项
const resourceOptions = [
	{
		value: "promptRecord",
		label: "收录库",
		icon: Icons.prompt,
	},
	// 后续可扩展：Agent.md、Skills 等
];

type PromoteDraftPopoverProps = {
	// 草稿 ID
	id: string;
	// 草稿名称
	name: string;
	// 触发按钮
	trigger: React.ReactElement;
};

// # 草稿复用级联选择器：左侧资源类型，右侧文件夹+标签
export function PromoteDraftPopover({ id, name, trigger }: PromoteDraftPopoverProps): JSX.Element {
	const [open, setOpen] = useState(false);
	// 当前选中的资源类型
	const [selectedResource] = useState(resourceOptions[0]);
	// 选中的文件夹 ID
	const [folderId, setFolderId] = useState<string | null>(null);
	// 选中的标签
	const [tags, setTags] = useState<TagOptionVo[]>([]);

	// 创建收录 mutation
	const { trigger: triggerCreateRecord, isMutating } = useSWRMutation("promote-draft", async () => {
		// 获取草稿全文
		const { content } = await getDraft(id);
		// 创建收录
		return createRecord({
			name,
			content,
			images: [],
			folderId: folderId ?? "",
			tags: tags.map((t) => t.id),
		});
	});

	// 确认复用
	const handleConfirm = async (): Promise<void> => {
		try {
			await triggerCreateRecord();
			toast.success("已复用到收录库");
			setOpen(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "复用失败");
		}
	};

	// 关闭弹窗时重置状态
	const handleOpenChange = (nextOpen: boolean): void => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setFolderId(null);
			setTags([]);
		}
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger render={trigger} />
			<PopoverContent className="w-auto p-0" align="center">
				<div className="flex min-w-100">
					{/* 左侧：资源类型列表 */}
					<div className="w-40 border-r">
						<div className="border-b px-3 py-2 font-medium text-muted-foreground text-sm">
							选择资源
						</div>
						<ScrollArea className="h-70">
							{resourceOptions.map((option) => {
								const Icon = option.icon;
								return (
									<div
										key={option.value}
										className="flex items-center gap-2 bg-accent px-3 py-2 font-medium text-primary text-sm"
									>
										<Icon className="size-4 shrink-0" />
										<span className="flex-1 truncate text-left">{option.label}</span>
										<Icons.check className="size-3" />
									</div>
								);
							})}
						</ScrollArea>
					</div>

					{/* 右侧：文件夹 + 标签选择 */}
					<div className="w-70">
						<div className="border-b px-3 py-2 font-medium text-muted-foreground text-sm">
							{selectedResource.label} - 选择位置
						</div>
						<div className="flex h-70 flex-col">
							<div className="flex-1 space-y-4 overflow-auto p-3">
								{/* 文件夹选择 */}
								<div className="space-y-2">
									<div className="font-medium text-muted-foreground text-xs">文件夹</div>
									<FolderCombobox
										resourceType="promptRecord"
										value={folderId}
										onChange={setFolderId}
									/>
								</div>

								{/* 标签选择 */}
								<div className="space-y-2">
									<div className="font-medium text-muted-foreground text-xs">标签</div>
									<div className="pl-2.5">
										<TagSelectTrigger resourceType="promptRecord" value={tags} onChange={setTags} />
									</div>
								</div>
							</div>

							{/* 底部确认按钮 */}
							<div className="border-t p-3">
								<Button className="w-full" onClick={handleConfirm} disabled={isMutating}>
									{isMutating ? "复用中..." : "确认复用"}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
