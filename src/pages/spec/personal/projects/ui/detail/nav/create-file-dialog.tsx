"use client";

// # 新建 AGENTS.md 配置对话框：配置名输入（默认 AGENTS.md 可改），提交后创建并刷新

import { useMutation } from "@tanstack/react-query";
import { type JSX, useEffect, useState } from "react";
import { toast } from "@/features/toast";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { AgentsMdSchemas } from "@/shared/lib/zod/schemas/project";
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

type CreateFileDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** 创建文件所属项目 */
	projectId: string;
	/** 父文件夹 id（配置创建即挂载到它下面） */
	parentFolderId: string;
	/** 父文件夹显示名，用于提示文案 */
	parentFolderName: string;
	/** 创建成功回调，参数为配置 id */
	onCreated: (id: string) => void;
};

// > 创建文件对话框：新建的配置创建即挂载到选中文件夹，默认配置名 AGENTS.md 可改为其它名称
export function CreateFileDialog({
	open,
	onOpenChange,
	projectId,
	parentFolderId,
	parentFolderName,
	onCreated,
}: CreateFileDialogProps): JSX.Element {
	// 默认配置名：AGENTS.md（平台沉淀配置的惯例命名）
	const [fileName, setFileName] = useState("AGENTS.md");

	// 创建配置 mutation：成功后由父级负责展开/刷新
	const { mutateAsync: createFileAsync, isPending } = useMutation({
		...orpc.agentsMds.create.mutationOptions(),
	});

	// open 打开时重置表单
	useEffect(() => {
		if (open) setFileName("AGENTS.md");
	}, [open]);

	// 提交：zod 校验 + 创建 + 上抛新配置 id
	const handleSubmit = async (): Promise<void> => {
		const parsed = AgentsMdSchemas.createDto.safeParse({
			projectId,
			folderId: parentFolderId,
			name: fileName.trim(),
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入配置名");
			return;
		}
		try {
			const created = await createFileAsync(parsed.data);
			toast.success("配置已创建");
			onCreated(created.id);
			onOpenChange(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建配置失败");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>新建配置</DialogTitle>
					<DialogDescription>将在「{parentFolderName}」下创建</DialogDescription>
				</DialogHeader>
				<DialogContentBody className="flex flex-col gap-2">
					<Label>配置名</Label>
					<Input
						value={fileName}
						onChange={(e) => setFileName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSubmit();
						}}
						placeholder="AGENTS.md"
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
