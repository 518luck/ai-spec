"use client";

import { useRouter } from "next/navigation";
import { type JSX, useState } from "react";
import { toast } from "sonner";
import { createDraft } from "@/entities/prompt";
import { createDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

type CreateDraftDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

// 创建草稿弹窗：填写名称（可选）和内容后提交到 POST /api/prompt/drafts
export function CreateDraftDialog({ open, onOpenChange }: CreateDraftDialogProps): JSX.Element {
	const router = useRouter();
	const [name, setName] = useState("");
	const [content, setContent] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	// 弹窗关闭时重置表单，避免下次打开残留上次输入
	const handleOpenChange = (next: boolean): void => {
		if (!next) {
			setName("");
			setContent("");
		}
		onOpenChange(next);
	};

	// 提交创建：用与后端同一份 schema 预校验，通过后调 API
	const handleCreate = async (): Promise<void> => {
		const parsed = createDraftDtoSchema.safeParse({
			name: name || undefined,
			content,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入草稿内容");
			return;
		}

		setIsCreating(true);
		try {
			await createDraft(parsed.data);
			toast.success("草稿已创建");
			router.refresh();
			handleOpenChange(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建失败，请稍后重试");
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg">新建草稿</DialogTitle>
					<DialogDescription className="text-sm leading-6">
						随手记录灵感，转正后进入收录库管理版本与标签。
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 py-2">
					<div className="flex flex-col gap-1.5">
						<label htmlFor="draft-name" className="font-medium text-sm">
							名称
							<span className="ml-1 text-muted-foreground">（可选）</span>
						</label>
						<Input
							id="draft-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="给草稿起个名字"
							maxLength={64}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="draft-content" className="font-medium text-sm">
							内容
						</label>
						<Textarea
							id="draft-content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="写下你的想法…"
							className="min-h-32"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						className="w-full"
						onClick={handleCreate}
						disabled={isCreating}
						aria-busy={isCreating}
					>
						{isCreating ? "创建中..." : "创建"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
