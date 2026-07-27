// # 鉴权页右侧侧边面板：居中承载「规约分发」品牌动画，小屏隐藏

import { SpecFlowScene } from "./spec-flow-scene";

export function SidePanel() {
	return (
		<div className="relative hidden h-full items-center justify-center overflow-hidden border-gray-500 border-l bg-background min-[900px]:flex">
			<SpecFlowScene />
		</div>
	);
}
