"use client";

import copy from "copy-to-clipboard";
import { type JSX, useState } from "react";

import { getRecord } from "@/entities/prompt";
import { toast } from "@/features/toast";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";

import { PromptCard } from "../../shared/ui/prompt-card";
import { EditRecordDialog } from "./edit-record-dialog";

type RecordCardProps = {
	// 收录 ID
	id: string;
	// 收录标题（必填，创建时已提取自第一个非空行）
	name: string;
	// 收录预览（截断后的内容）
	preview: string;
};

// # 收录卡片：基于 PromptCard，注入编辑操作 + 编辑弹窗
export function RecordCard({ id, name, preview }: RecordCardProps): JSX.Element {
	// 编辑弹窗开关
	const [editOpen, setEditOpen] = useState(false);
	// 复制进行中标志：拉全文期间禁用按钮 + 触发卡片 loading 蒙层
	const [isCopying, setIsCopying] = useState(false);

	// 复制：拉全文 → 写剪贴板。一次性只读请求，不需要缓存，用裸 fetch + useState 最直接
	const handleCopy = async (): Promise<void> => {
		setIsCopying(true);
		try {
			const { content } = await getRecord(id);
			copy(content);
			toast.success("已复制");
		} catch {
			toast.error("复制失败");
		} finally {
			setIsCopying(false);
		}
	};

	return (
		<PromptCard
			name={name}
			preview={preview}
			onCopy={handleCopy}
			isCopying={isCopying}
			// > 底部 hover 遮罩的操作：编辑
			actions={
				<Button variant="ghost" size="icon-sm" aria-label="编辑" onClick={() => setEditOpen(true)}>
					<Icons.pencil className="size-4" />
				</Button>
			}
		>
			{/* 编辑弹窗 */}
			<EditRecordDialog id={id} open={editOpen} onOpenChange={setEditOpen} />
		</PromptCard>
	);
}
