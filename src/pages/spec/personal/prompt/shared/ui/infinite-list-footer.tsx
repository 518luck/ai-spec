"use client";

import type { ReactNode, Ref } from "react";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";

// # 无限滚动列表底部：哨兵 + 翻页 loader + 到底提示三态合一
// > 哨兵进入视口触发 setSize 翻页的逻辑由调用方负责（useInView + useEffect），本组件只负责渲染底部三态

type InfiniteListFooterProps = {
	// 是否还有下一页：true 渲染哨兵 + 翻页 loader，false 渲染到底提示
	hasMore: boolean;
	// 是否已翻过页（已加载页数 > 1）；与 hasMore 组合判断短列表：首页即到底且未翻页时不渲染任何内容
	hasPaged: boolean;
	// 是否正在加载下一页（useSWRInfinite 的 isValidating）
	isValidating: boolean;
	// 哨兵元素 ref，调用方用 useInView 返回的 ref 传入（兼容 RefObject 与 RefCallback 两种形态）
	sentinelRef: Ref<HTMLDivElement>;
	// 到底提示文案，如"到底了，没有更多草稿了"
	endText?: ReactNode;
};

export function InfiniteListFooter({
	hasMore,
	hasPaged,
	isValidating,
	sentinelRef,
	endText = "到底了",
}: InfiniteListFooterProps): ReactNode {
	// 短列表兜底：首页即到底（hasMore=false）且未翻过页时，列表本就很短，不渲染"到底了"提示
	if (!hasMore && !hasPaged) {
		return null;
	}

	// 无下一页：渲染到底提示
	if (!hasMore) {
		return <div className="flex justify-center py-6 text-muted-foreground text-sm">{endText}</div>;
	}

	// 有下一页：渲染哨兵 + 翻页 loader（loader 在 isValidating 时才出现，哨兵常驻以便下次进入视口触发）
	return (
		<>
			<div ref={sentinelRef} className="h-4" />
			{isValidating ? (
				<div className="flex justify-center py-6 text-muted-foreground">
					<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
				</div>
			) : null}
		</>
	);
}
