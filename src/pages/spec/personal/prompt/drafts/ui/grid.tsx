import type { JSX } from "react";

import type { DraftVo } from "@/shared/lib/zod/schemas/prompt/draft";

import { Card } from "./card";

type GridProps = {
	// 当前页草稿列表
	drafts: DraftVo[];
};

// # 草稿卡片网格：auto-fill 自适应列数，所有卡片保持同宽
export function Grid({ drafts }: GridProps): JSX.Element {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 xl:gap-4 2xl:gap-6">
			{drafts.map((draft) => (
				<Card key={draft.id} id={draft.id} name={draft.name} preview={draft.preview} />
			))}
		</div>
	);
}
