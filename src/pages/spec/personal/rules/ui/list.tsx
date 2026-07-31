"use client";

// # 规约列表：按视图切换表格（传统分页）或卡片（无限滚动）
// > 数据请求和状态管理分别内聚在 table/ 和 grid/ 容器中，本组件只负责视图切换

import type { OnChangeFn, VisibilityState } from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import type { JSX } from "react";

import { LIST_SWITCH_MOTION } from "../lib/list-motion";
import { RuleGridContainer } from "./grid";
import type { RuleView } from "./rule-toolbar";
import { RuleTableContainer } from "./table";

type RuleListProps = {
	folderId?: string;
	spaceId?: string;
	tagIds?: string;
	q?: string;
	view: RuleView;
	onCreate?: () => void;
	// 列可见性（仅表格视图用，提升到 page 层与 toolbar 共享）
	columnVisibility: VisibilityState;
	onColumnVisibilityChange: OnChangeFn<VisibilityState>;
};

export function RuleList({
	folderId,
	spaceId,
	tagIds,
	q,
	view,
	onCreate,
	columnVisibility,
	onColumnVisibilityChange,
}: RuleListProps): JSX.Element {
	return (
		<AnimatePresence mode="wait">
			{view === "table" ? (
				<motion.div key="table" {...LIST_SWITCH_MOTION}>
					<RuleTableContainer
						folderId={folderId}
						spaceId={spaceId}
						tagIds={tagIds}
						q={q}
						onCreate={onCreate}
						columnVisibility={columnVisibility}
						onColumnVisibilityChange={onColumnVisibilityChange}
					/>
				</motion.div>
			) : (
				<motion.div key="grid" className="flex flex-1 flex-col" {...LIST_SWITCH_MOTION}>
					<RuleGridContainer
						folderId={folderId}
						spaceId={spaceId}
						tagIds={tagIds}
						q={q}
						onCreate={onCreate}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
