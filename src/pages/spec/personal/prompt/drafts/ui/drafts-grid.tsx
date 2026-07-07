import type { JSX } from "react";

import { Icons } from "@/shared/ui/icons";
import { DraftCard } from "./draft-card";

// 草稿列表项，由服务端查询后传入
export type DraftItem = {
	id: string;
	name: string | null;
	content: string;
	updated_at: Date;
};

type DraftsGridProps = {
	// 当前页草稿列表
	drafts: DraftItem[];
};

// 草稿卡片网格，响应式布局：手机单列、平板两列、桌面三列
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

// 草稿列表为空时的占位提示
export function DraftsEmptyState(): JSX.Element {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
			<Icons.prompt className="size-8 opacity-40" />
			<p className="text-sm">还没有草稿，随手记下你的灵感吧</p>
		</div>
	);
}
