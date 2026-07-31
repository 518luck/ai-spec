"use client";

// # 按 URL 导入弹窗：粘贴 GitHub 仓库链接，后端抓取其中所有 SKILL.md 入库

import { type JSX, useState } from "react";
import { toast } from "@/features/toast";
import { client } from "@/shared/lib/orpc/client";
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
import { Spinner } from "@/shared/ui/spinner";

type ImportDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 导入成功后触发，由页面重拉列表
	onImported: () => void;
};

export function ImportDialog({ open, onOpenChange, onImported }: ImportDialogProps): JSX.Element {
	const [url, setUrl] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// > 提交导入：成功后提示条数、清空输入并关闭；失败弹后端错误文案
	const handleSubmit = async (): Promise<void> => {
		if (!url.trim() || submitting) return;
		setSubmitting(true);
		try {
			const { imported } = await client.discoverSkills.import({ url: url.trim() });
			toast.success(`成功导入 ${imported} 个 skill`);
			setUrl("");
			onImported();
			onOpenChange(false);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "导入失败，稍后再试试吧");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>导入 Skills</DialogTitle>
					<DialogDescription>
						粘贴一个公开的 GitHub 仓库链接，其中的 SKILL.md
						会被自动收进广场。广场只索引名称、描述、协议与回链，不转载 SKILL.md 全文。
					</DialogDescription>
				</DialogHeader>

				<DialogContentBody>
					<Input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSubmit();
						}}
						placeholder="https://github.com/anthropics/skills"
						autoFocus
					/>
				</DialogContentBody>

				<DialogFooter>
					<Button className="w-full" onClick={handleSubmit} disabled={!url.trim() || submitting}>
						{submitting ? <Spinner className="size-4" /> : null}
						{submitting ? "正在抓取解析…" : "导入"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
