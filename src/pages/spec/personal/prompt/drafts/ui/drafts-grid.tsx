import type { JSX } from "react";

import { DraftCard } from "./draft-card";

// 草稿列表项，由客户端 API 返回（updated_at 为 ISO 字符串）
export type DraftItem = {
	id: string;
	name: string | null;
	content: string;
	updated_at: string;
};

type DraftsGridProps = {
	// 当前页草稿列表
	drafts: DraftItem[];
};

// # 草稿卡片网格：响应式布局，手机单列 / 平板两列 / 桌面三列
export function DraftsGrid({ drafts }: DraftsGridProps): JSX.Element {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{drafts.map((draft) => (
				<DraftCard
					key={draft.id}
					id={draft.id}
					name={draft.name}
					content={draft.content}
					updatedAt={draft.updated_at}
				/>
			))}
		</div>
	);
}
