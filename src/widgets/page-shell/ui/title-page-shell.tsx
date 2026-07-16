// # 带标题栏的页面外壳：可选标题 + 可滚动正文区（正文走 PageWidthWrapper 限宽）

import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { PageWidthWrapper } from "./page-width-wrapper";

type TitlePageShellProps = Omit<ComponentProps<"div">, "title"> & {
	title?: ReactNode;
	/** 是否让内容区撑满父级剩余高度（表格等需要占满视口的场景），默认关闭 */
	fill?: boolean;
};

// 提供可选标题栏和可滚动正文区的页面外壳。
export function TitlePageShell({
	title,
	fill,
	className,
	children,
	...props
}: TitlePageShellProps): JSX.Element {
	return (
		<div
			data-slot="title-page-shell"
			className={cn("flex h-full min-h-0 flex-col", className)}
			{...props}
		>
			{title ? (
				<div
					data-slot="title-page-shell-header"
					className="flex h-16 shrink-0 items-center border-b px-6"
				>
					{typeof title === "string" ? (
						<h1 className="font-semibold text-lg leading-tight">{title}</h1>
					) : (
						title
					)}
				</div>
			) : null}

			<PageWidthWrapper fill={fill}>{children}</PageWidthWrapper>
		</div>
	);
}
