import type { JSX } from "react";

import type { RecordVo } from "@/shared/lib/zod/schemas/prompt/record";

import { RecordCard } from "./record-card";

type RecordsGridProps = {
	// 当前页收录列表
	records: RecordVo[];
};

// # 收录卡片网格：auto-fill 自适应列数，所有卡片保持同宽
export function RecordsGrid({ records }: RecordsGridProps): JSX.Element {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 xl:gap-4 2xl:gap-6">
			{records.map((record) => (
				<RecordCard key={record.id} id={record.id} name={record.name} preview={record.preview} />
			))}
		</div>
	);
}
