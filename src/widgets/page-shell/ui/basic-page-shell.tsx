import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { PageWidthWrapper } from "./page-width-wrapper";

type BasicPageShellProps = Omit<ComponentProps<"div">, "title"> & {
	title?: ReactNode;
};

// 提供可选标题栏和可滚动正文区的基础页面外壳。
export function BasicPageShell({
	title,
	className,
	children,
	...props
}: BasicPageShellProps): JSX.Element {
	return (
		<div
			data-slot="basic-page-shell"
			className={cn("flex h-full min-h-0 flex-col", className)}
			{...props}
		>
			{title ? (
				<div
					data-slot="basic-page-shell-header"
					className="flex h-16 shrink-0 items-center border-b px-6"
				>
					{typeof title === "string" ? (
						<h1 className="font-semibold text-lg leading-tight">{title}</h1>
					) : (
						title
					)}
				</div>
			) : null}

			<PageWidthWrapper>{children}</PageWidthWrapper>
		</div>
	);
}
