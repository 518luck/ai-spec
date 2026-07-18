import type { JSX } from "react";

import { getRecord } from "@/entities/prompt";

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
	return (
		<PromptCard
			name={name}
			preview={preview}
			fetchFullContent={async () => (await getRecord(id)).content}
		/>
	);
}
