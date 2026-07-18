// # 区域级居中 loader：依赖父级链中的 positioned 祖先（relative/absolute/fixed）
// ! absolute inset-0 让 loader 锚定到最近的 positioned 祖先，在其范围内垂直水平双居中
// ! 本组件隐式依赖父级链含 positioned 祖先，若无则 loader 会锚定到更外层（如 <html>）导致跑位
// > 本项目典型锚点：DualSidebarContent 的 inner div（含 relative），与 isPending 的 loader 共享中心

import type { JSX } from "react";

import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";

// 居中 loader，锚定最近的 positioned 祖先并在其范围内居中
export function CenteredLoader(): JSX.Element {
	return (
		<div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
			<ScaleLoaderWrap />
		</div>
	);
}
