"use client";

// # 新建项目对话框：左侧数据录入（名称/描述/文件夹）+ 右侧模板选择与文件结构预览

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type JSX, useEffect, useState } from "react";
import { FolderCombobox, FolderIcon } from "@/features/folder-combobox";
import { FOLDER_NEUTRAL_COLOR } from "@/features/folder-combobox/config/folder-colors";
import { toast } from "@/features/toast";
import { projectKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { ProjectSchemas } from "@/shared/lib/zod/schemas/project";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogContentBody,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Icons } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { TemplateCombobox } from "./template-combobox";
import { TemplateTree } from "./template-tree";

type CreateProjectDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps): JSX.Element {
	const qc = useQueryClient();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [folderId, setFolderId] = useState<string | null>(null);
	// 右上角预览图标色：跟随选中的文件夹，未分类用中性灰
	const [folderColor, setFolderColor] = useState<string>(FOLDER_NEUTRAL_COLOR);
	const [templateKey, setTemplateKey] = useState<string>("blank");

	// 创建项目 mutation：成功后广播失效，刷新项目列表
	const { mutateAsync: createProjectAsync, isPending } = useMutation({
		...orpc.projects.create.mutationOptions(),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: projectKeys.all });
		},
	});

	// open 打开时重置表单
	useEffect(() => {
		if (open) {
			setName("");
			setDescription("");
			setFolderId(null);
			setFolderColor(FOLDER_NEUTRAL_COLOR);
			setTemplateKey("blank");
		}
	}, [open]);

	// 提交：zod 校验 + 创建 + 关弹窗
	const handleSubmit = async (): Promise<void> => {
		const parsed = ProjectSchemas.createDto.safeParse({
			name: name.trim(),
			description: description.trim() || undefined,
			folderId,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入项目名称");
			return;
		}
		await createProjectAsync(parsed.data);
		toast.success("项目已创建");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-2xl">
				<DialogHeader className="relative">
					<DialogTitle>新建项目</DialogTitle>
					<DialogDescription className="pr-16">
						创建一个属于你的项目，取个好记的名字吧。
					</DialogDescription>
					<FolderIcon
						color={folderColor}
						icon={Icons.folderPlus}
						className="absolute top-4 right-4 size-12 rounded-lg"
						iconClassName="size-6"
					/>
				</DialogHeader>

				<DialogContentBody className="flex gap-4">
					{/* // 左侧：数据录入 */}
					<div className="flex min-w-0 flex-1 flex-col gap-3">
						<div className="flex flex-col gap-2">
							<Label>项目名称</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSubmit();
								}}
								placeholder="输入项目名称"
								autoFocus
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>描述（可选）</Label>
							<Textarea
								className="max-h-32"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="补充说明项目用途"
								rows={3}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>选择模板</Label>
							<TemplateCombobox templateKey={templateKey} onTemplateChange={setTemplateKey} />
						</div>
						<div className="flex flex-col gap-2">
							<Label>所属文件夹（可选）</Label>
							<FolderCombobox
								resourceType="project"
								value={folderId}
								onChange={setFolderId}
								onChangeOption={(option) => setFolderColor(option?.color ?? FOLDER_NEUTRAL_COLOR)}
								className="h-9 w-full border border-input"
							/>
						</div>
					</div>

					{/* // 右侧：文件结构预览 */}
					<div className="flex w-72 shrink-0 flex-col gap-2">
						<span className="text-muted-foreground text-xs">文件结构</span>
						<TemplateTree templateKey={templateKey} projectName={name} className="flex-1" />
					</div>
				</DialogContentBody>

				<DialogFooter>
					<Button className="w-full" onClick={handleSubmit} disabled={isPending}>
						{isPending ? "创建中..." : "创建"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
