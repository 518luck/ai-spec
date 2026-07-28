// # 带标题栏的页面外壳：可选标题 + 可滚动内容区

import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";

type TitlePageShellProps = Omit<ComponentProps<"div">, "title"> & {
	title?: ReactNode; // 页面标题，可传字符串或带图标的 ReactNode
	/** 是否用 ScrollArea 包裹内容（默认开启）；内部自带滚动的组件（如撑满视口的表格）应关闭，避免双重滚动 */
	scrollable?: boolean;
	/** 标题栏是否浮在内容之上（仅 scrollable=false 生效）：内容从页面顶端起算、滚动时穿过标题栏，供自带滚动的编辑器使用 */
	floatingHeader?: boolean;
};

// 提供可选标题栏和可滚动内容区的页面外壳。
// scrollable 模式（默认）下标题栏 sticky 吸顶、滚动时内容穿过其后方产生毛玻璃；
// 非滚动模式下标题栏固定占位、内容直接撑满父级，供"内部自己分配高度的表格"使用；
// 非滚动 + floatingHeader 时标题栏改为浮层，不占布局高度，内容自管滚动并从其下方穿过。
export function TitlePageShell({
	title,
	scrollable = true,
	floatingHeader = false,
	className,
	children,
	...props
}: TitlePageShellProps): JSX.Element {
	const headerContent = title ? (
		typeof title === "string" ? (
			<h1 className="font-semibold text-lg leading-tight">{title}</h1>
		) : (
			title
		)
	) : null;

	return (
		<div
			data-slot="title-page-shell"
			className={cn("flex h-full min-h-0 flex-col", floatingHeader && "relative", className)}
			{...props}
		>
			{scrollable ? (
				<ScrollArea
					// min-h-0：flex 子项可低于内容固有高度，保证内部滚动不漏到外层原生条
					className="h-full max-h-full min-h-0"
					// 滚动条从标题栏下方开始，避免穿过标题栏区域
					scrollbarClassName="!top-16 data-[orientation=vertical]:!h-[calc(100%-4rem)]"
				>
					{headerContent ? (
						<div
							data-slot="title-page-shell-header"
							className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-linear-to-b from-background/80 to-background/5 px-6 backdrop-blur-sm"
						>
							{headerContent}
						</div>
					) : null}
					{children}
				</ScrollArea>
			) : (
				<>
					{headerContent ? (
						<div
							data-slot="title-page-shell-header"
							className={cn(
								"flex h-16 shrink-0 items-center border-b px-6",
								// 浮层模式：脱离布局盖在内容上方，半透明渐变 + 毛玻璃，滚动的内容从下方透出
								floatingHeader &&
									"absolute inset-x-0 top-0 z-10 bg-linear-to-b from-background/80 to-background/5 backdrop-blur-sm",
							)}
						>
							{headerContent}
						</div>
					) : null}
					{children}
				</>
			)}
		</div>
	);
}
