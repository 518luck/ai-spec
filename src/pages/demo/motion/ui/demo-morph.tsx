"use client";

// # 共享布局形变：卡片和展开面板挂同一个 layoutId，motion 自己算两者的位置差补出中间帧，点开像是同一块东西长大

import { AnimatePresence, motion } from "motion/react";
import { type JSX, useState } from "react";

import { MORPH_CONTENT_TRANSITION, MORPH_RADIUS, MORPH_TRANSITION } from "@/shared/lib/motion";

const MORPH_ID = "demo-morph-panel";

export function DemoMorph(): JSX.Element {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="relative grid h-44 place-items-center">
			{!expanded && (
				<motion.button
					type="button"
					layoutId={MORPH_ID}
					className="w-44 border border-border bg-background p-3 text-left"
					style={{ borderRadius: MORPH_RADIUS.card }}
					transition={MORPH_TRANSITION}
					onClick={() => setExpanded(true)}
				>
					<motion.div layout="position" className="flex flex-col gap-1">
						<span className="font-medium text-sm">命名规范</span>
						<span className="text-muted-foreground text-xs">点开展开面板</span>
					</motion.div>
				</motion.button>
			)}

			<AnimatePresence>
				{expanded && (
					<>
						{/* // 遮罩单独淡入淡出，不参与形变，否则会被当成面板的一部分一起缩放 */}
						<motion.div
							className="absolute inset-0 bg-foreground/10"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setExpanded(false)}
						/>

						<motion.div
							layoutId={MORPH_ID}
							className="absolute inset-x-2 inset-y-0 border border-border bg-card p-4 shadow-lg"
							style={{ borderRadius: MORPH_RADIUS.panel }}
							transition={MORPH_TRANSITION}
						>
							<motion.div
								className="flex h-full flex-col gap-2"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0, transition: { duration: 0.08 } }}
								transition={MORPH_CONTENT_TRANSITION}
							>
								<h4 className="font-medium text-sm">命名规范</h4>
								<p className="text-muted-foreground text-xs leading-relaxed">
									文件名用 kebab-case，组件用 PascalCase，非组件函数用 const 箭头函数。
								</p>
								<button
									type="button"
									className="mt-auto self-start text-primary text-xs underline-offset-4 hover:underline"
									onClick={() => setExpanded(false)}
								>
									收起
								</button>
							</motion.div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
