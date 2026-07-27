"use client";

// # 规约列表：统一拉数据 + 加载/空态，再按当前视图渲染表格或卡片网格
// > 加载/空/表格/卡片四种状态都挂在同一个 AnimatePresence 下并各自带 key，状态一变就先淡出旧的再淡入新的

import { AnimatePresence, motion } from "motion/react";
import type { JSX } from "react";
import useSWR from "swr";

import { getRules } from "@/entities/rule";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { EmptyState } from "@/widgets/empty-state";
import { LIST_SWITCH_MOTION } from "../lib/list-motion";
import { RuleGrid } from "./grid";
import { RuleTable } from "./table";
import type { RuleView } from "./view-toggle";

type RuleListProps = {
	folderId?: string;
	// 当前领域空间：顶层隔离，只查该空间内的规约
	spaceId?: string;
	tagIds?: string;
	q?: string;
	// 当前视图：表格或卡片，来自 URL ?view=
	view: RuleView;
};

export function RuleList({ folderId, spaceId, tagIds, q, view }: RuleListProps): JSX.Element {
	// 获取规约列表，支持空间/文件夹/标签筛选和搜索
	const { data, isLoading } = useSWR(["rules", folderId, spaceId, tagIds, q], () =>
		getRules({ folderId, spaceId, tagIds, q }),
	);

	const rules = data?.data ?? [];

	// 按加载/空/视图选出当前要渲染的内容；key 决定 AnimatePresence 在哪一步做进出场
	const renderContent = (): JSX.Element => {
		if (isLoading) {
			return (
				<motion.div
					key="loading"
					className="flex h-60 items-center justify-center text-muted-foreground"
					{...LIST_SWITCH_MOTION}
				>
					<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
				</motion.div>
			);
		}

		if (rules.length === 0) {
			return (
				// flex flex-1 flex-col 让 EmptyState 的 flex-1 仍能撑开并垂直居中
				<motion.div key="empty" className="flex flex-1 flex-col" {...LIST_SWITCH_MOTION}>
					<EmptyState
						icon={Icons.rulesLibrary}
						description={
							folderId || tagIds || q
								? "当前筛选条件下暂无规约"
								: "还没有规约，点右上角「新增规约」写一条吧"
						}
					/>
				</motion.div>
			);
		}

		if (view === "grid") return <RuleGrid key="grid" rules={rules} />;
		return <RuleTable key="table" rules={rules} />;
	};

	// ! mode="wait"：表格是撑满视口的固定高度、卡片网格是内容高度，同时在场会互相挤位，必须等旧的退完再进新的
	return (
		<AnimatePresence mode="wait" initial={false}>
			{renderContent()}
		</AnimatePresence>
	);
}
