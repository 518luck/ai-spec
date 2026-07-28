"use client";

// # Typed.js 打字机演示：多句循环输入/回删，适合 Hero 口号与空状态引导文案

import type { JSX } from "react";

import { TypedText } from "@/shared/ui/typed-text";

const STRINGS = [
	"把团队规约写成可执行的上下文",
	"从 GitHub 发现好用的 Agent Skills",
	"提示词、规则、技能，一处沉淀处处生效",
] as const;

export function DemoTyped(): JSX.Element {
	return (
		<div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
			<p className="text-muted-foreground text-xs tracking-wide">TYPED.JS</p>
			<TypedText
				strings={STRINGS}
				className="justify-center font-semibold text-lg tracking-tight"
				typeSpeed={42}
				backSpeed={24}
				backDelay={1600}
				loop
			/>
			<p className="text-muted-foreground text-xs">打完回删，再打下一句</p>
		</div>
	);
}
