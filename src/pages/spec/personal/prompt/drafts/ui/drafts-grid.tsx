import type { JSX } from "react";

import type { DraftVo } from "@/shared/lib/zod/schemas/prompt/draft";

import { DraftCard } from "./draft-card";

type DraftsGridProps = {
	// 当前页草稿列表
	drafts: DraftVo[];
};

// # 草稿卡片网格：响应式布局，手机单列 / 平板两列 / 桌面三列
export function DraftsGrid({ drafts }: DraftsGridProps): JSX.Element {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{drafts.map((draft) => (
				<DraftCard
					key={draft.id}
					id={draft.id}
					name={draft.name}
					content={draft.content}
					updatedAt={draft.updatedAt}
				/>
			))}
		</div>
	);
}
