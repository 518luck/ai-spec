"use client";

// # 空状态编排：搜索无结果 → 扫描搜寻动画，内容为空 → 文件夹动画 + 创建按钮

import type { JSX, ReactNode } from "react";

import { AnimatedEmptyFolder } from "./animated-empty-folder";
import { AnimatedEmptySearch } from "./animated-empty-search";
import { MagneticButton } from "./magnetic-button";

type EmptyActionProps = {
	// 搜索关键词，非空时展示扫描搜寻空态
	q?: string;
	// 前盖中央的页面标识图标
	icon?: ReactNode;
	// 主标题文案
	title?: string;
	// 副标题文案
	description?: string;
	// 磁吸按钮文案
	actionLabel?: string;
	// 磁吸按钮点击回调
	onAction?: () => void;
};

export function EmptyAction({
	q,
	icon,
	title,
	description,
	actionLabel = "开始创建",
	onAction,
}: EmptyActionProps): JSX.Element {
	// 搜索无结果：放大镜扫描搜寻动画
	if (q) {
		return <AnimatedEmptySearch />;
	}

	return (
		<div className="flex flex-col items-center text-center">
			<AnimatedEmptyFolder icon={icon} title={title} description={description} />
			{onAction ? <MagneticButton label={actionLabel} onClick={onAction} /> : null}
		</div>
	);
}
