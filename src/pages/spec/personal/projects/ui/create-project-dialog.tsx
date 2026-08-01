"use client";

// # 新建项目对话框：输入名称、描述、选文件夹，模板选择器为纯 UI 占位

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type JSX, useEffect, useState } from "react";
import { FolderCombobox } from "@/features/folder-combobox";
import { toast } from "@/features/toast";
import { projectKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { cn } from "@/shared/lib/utils";
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
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type CreateProjectDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

// @ 模板占位列表：纯 UI 选择，不提交后端、不生成初始文档
const PROJECT_TEMPLATES = [
	{ key: "blank", name: "空白项目", desc: "从零开始搭建" },
	{ key: "nextjs", name: "Next.js", desc: "全栈 React 框架" },
	{ key: "api", name: "API 服务", desc: "后端接口服务" },
	{ key: "monorepo", name: "Monorepo", desc: "多包仓库结构" },
] as const;

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps): JSX.Element {
	const qc = useQueryClient();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [folderId, setFolderId] = useState<string | null>(null);
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
			<DialogContent showCloseButton={false} className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>新建项目</DialogTitle>
					<DialogDescription>创建一个属于你的项目，取个好记的名字吧。</DialogDescription>
				</DialogHeader>

				<DialogContentBody className="flex flex-col gap-3">
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
						<Label>所属文件夹（可选）</Label>
						<FolderCombobox resourceType="project" value={folderId} onChange={setFolderId} />
					</div>
					<div className="flex flex-col gap-2">
						<Label>选择模板</Label>
						<div className="grid grid-cols-2 gap-2">
							{PROJECT_TEMPLATES.map((template) => (
								<Button
									key={template.key}
									variant="ghost"
									onClick={() => setTemplateKey(template.key)}
									className={cn(
										"flex h-auto flex-col items-start gap-0.5 p-3 text-left",
										templateKey === template.key &&
											"ring-2 ring-ring ring-offset-1 ring-offset-background",
									)}
								>
									<span className="font-medium text-sm">{template.name}</span>
									<span className="text-muted-foreground text-xs">{template.desc}</span>
								</Button>
							))}
						</div>
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
