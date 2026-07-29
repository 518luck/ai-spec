"use client";

// # 规约卡片网格：auto-fill 自适应列数，所有卡片保持同宽（与收录页一致）
// > 整块跟着视图切换进出场，卡片再按索引错峰浮现

import { motion } from "motion/react";
import type { JSX } from "react";

import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { CARD_ITEM_MOTION, itemTransition } from "../../lib/list-motion";
import { RuleCard } from "./card";

type RuleGridProps = {
	rules: RuleListItemVo[];
};

export function RuleGrid({ rules }: RuleGridProps): JSX.Element {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 xl:gap-4 2xl:gap-6">
			{rules.map((rule, index) => (
				<motion.div key={rule.id} {...CARD_ITEM_MOTION} transition={itemTransition(index)}>
					<RuleCard rule={rule} />
				</motion.div>
			))}
		</div>
	);
}
