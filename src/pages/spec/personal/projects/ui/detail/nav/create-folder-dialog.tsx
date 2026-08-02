"use client";

// # 新建项目内文件夹对话框：文件夹名输入，提交后创建空文件夹并刷新（空文件夹持久化在 ProjectFolder 表）

import { useMutation } from "@tanstack/react-query";
import { type JSX, useEffect, useState } from "react";
import { toast } from "@/features/toast";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { ProjectFolderSchemas } from "@/shared/lib/zod/schemas/project";
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
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type CreateFolderDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** 创建文件夹所属项目 */
	projectId: string;
	/** 父文件夹 id（缺省逻辑在 service 侧回落项目根文件夹，这里始终传当前选中项） */
	parentFolderId: string;
	/** 父文件夹显示名，用于提示文案 */
	parentFolderName: string;
	/** 创建成功回调，参数为文件夹 id */
	onCreated: (id: string) => void;
};

// > 创建文件夹对话框：文件夹以 parentId 挂接父级，可独立于配置存在（纯归纳组织）
export function CreateFolderDialog({
	open,
	onOpenChange,
	projectId,
	parentFolderId,
	parentFolderName,
	onCreated,
}: CreateFolderDialogProps): JSX.Element {
	const [name, setName] = useState("");

	// 创建文件夹 mutation：成功后由父级负责展开/刷新
	const { mutateAsync: createFolderAsync, isPending } = useMutation({
		...orpc.projects.projectFolders.create.mutationOptions(),
	});

	// open 打开时重置表单
	useEffect(() => {
		if (open) setName("");
	}, [open]);

	// 提交：zod 校验 + 创建 + 上抛新文件夹 id
	const handleSubmit = async (): Promise<void> => {
		const parsed = ProjectFolderSchemas.createDto.safeParse({
			projectId,
			parentId: parentFolderId,
			name: name.trim(),
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入文件夹名");
			return;
		}
		try {
			const created = await createFolderAsync(parsed.data);
			toast.success("文件夹已创建");
			onCreated(created.id);
			onOpenChange(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建文件夹失败");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>新建文件夹</DialogTitle>
					<DialogDescription>将在「{parentFolderName}」下创建</DialogDescription>
				</DialogHeader>
				<DialogContentBody className="flex flex-col gap-2">
					<Label>文件夹名</Label>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSubmit();
						}}
						placeholder="输入文件夹名"
						autoFocus
					/>
				</DialogContentBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						取消
					</Button>
					<Button onClick={handleSubmit} disabled={isPending}>
						{isPending ? "创建中..." : "创建"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
