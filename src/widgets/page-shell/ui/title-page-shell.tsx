// # 带标题栏的页面外壳：可选标题 + 可滚动内容区

import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type TitlePageShellProps = Omit<ComponentProps<"div">, "title"> & {
	title?: ReactNode; // 页面标题，可传字符串或带图标的 ReactNode
};

// 提供可选标题栏和可滚动内容区的页面外壳，内容宽度由调用方自行控制。
export function TitlePageShell({
	title,
	className,
	children,
	...props
}: TitlePageShellProps): JSX.Element {
	return (
		<div
			data-slot="title-page-shell"
			className={cn("flex h-full min-h-0 flex-col overflow-auto", className)}
			{...props}
		>
			{title ? (
				<div
					data-slot="title-page-shell-header"
					className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-linear-to-b from-background/80 to-background/5 px-6 backdrop-blur-sm"
				>
					{typeof title === "string" ? (
						<h1 className="font-semibold text-lg leading-tight">{title}</h1>
					) : (
						title
					)}
				</div>
			) : null}

			{/* 内容区：占满剩余高度，宽度限制与滚动交给调用方 */}
			<div className="flex min-h-0 flex-1 flex-col">{children}</div>
		</div>
	);
}
