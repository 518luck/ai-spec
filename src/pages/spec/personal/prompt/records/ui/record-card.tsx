"use client";

import copy from "copy-to-clipboard";
import { type JSX, useState } from "react";

import { getRecord } from "@/entities/prompt";
import { toast } from "@/features/toast";

import { PromptCard } from "../../shared/ui/prompt-card";

type RecordCardProps = {
	// 收录 ID
	id: string;
	// 收录标题（必填，创建时已提取自第一个非空行）
	name: string;
	// 收录预览（截断后的内容）
	preview: string;
};

// # 收录卡片：基于 PromptCard，暂无 hover 操作（后续接入编辑/删除时通过 actions 传入）
export function RecordCard({ id, name, preview }: RecordCardProps): JSX.Element {
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

	return <PromptCard name={name} preview={preview} onCopy={handleCopy} isCopying={isCopying} />;
}
