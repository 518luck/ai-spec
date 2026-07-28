import type { JSX } from "react";

import type { RecordVo } from "@/shared/lib/zod/schemas/prompt/record";

import { Card } from "./card";

type GridProps = {
	// 当前页收录列表
	records: RecordVo[];
	// 点击卡片编辑按钮时触发，由顶层全局编辑器接管打开
	onEdit: (recordId: string) => void;
	// 顶层编辑器当前编辑的收录 id（null = 未打开）；卡片靠它判断要不要让出形变锚点
	editingId: string | null;
};

// # 收录卡片网格：auto-fill 自适应列数，所有卡片保持同宽
export function Grid({ records, onEdit, editingId }: GridProps): JSX.Element {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 xl:gap-4 2xl:gap-6">
			{records.map((record) => (
				<Card
					key={record.id}
					id={record.id}
					name={record.name}
					preview={record.preview}
					favorite={record.favorite}
					onEdit={() => onEdit(record.id)}
					isEditing={record.id === editingId}
				/>
			))}
		</div>
	);
}
