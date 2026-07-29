"use client";

// # 空文件夹 + 创建按钮编排：组合 AnimatedEmptyFolder 与 MagneticButton，适合"内容为空、等待创建"的场景

import type { JSX, ReactNode } from "react";

import { AnimatedEmptyFolder } from "./animated-empty-folder";
import { MagneticButton } from "./magnetic-button";

type EmptyFolderActionProps = {
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

export function EmptyFolderAction({
	icon,
	title,
	description,
	actionLabel = "开始创建",
	onAction,
}: EmptyFolderActionProps): JSX.Element {
	return (
		<div className="flex flex-col items-center text-center">
			<AnimatedEmptyFolder icon={icon} title={title} description={description} />
			{onAction ? <MagneticButton label={actionLabel} onClick={onAction} /> : null}
		</div>
	);
}
