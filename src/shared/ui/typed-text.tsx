"use client";

// # Typed.js 打字机：挂载后逐字输入，卸载时 destroy，避免泄漏与重复实例

import { type JSX, useEffect, useRef } from "react";
import Typed, { type TypedOptions } from "typed.js";

import { cn } from "@/shared/lib/utils";

type TypedTextProps = {
	// 要轮播/打出的文案列表
	strings: readonly string[];
	// 打字速度（ms/字），默认偏阅读节奏
	typeSpeed?: number;
	// 回删速度（ms/字）
	backSpeed?: number;
	// 打完一句后停顿再回删（ms）
	backDelay?: number;
	// 是否循环；默认 true
	loop?: boolean;
	// 是否显示光标（组件自绘，不依赖库注入的全局 CSS）
	showCursor?: boolean;
	// 光标字符
	cursorChar?: string;
	// 透传 className 到外层
	className?: string;
	// 额外 Typed.js 选项（strings / showCursor / autoInsertCss 由组件托管）
	options?: Omit<TypedOptions, "strings" | "showCursor" | "autoInsertCss" | "cursorChar">;
};

// > 打字机文本：文案或速度变化会重建实例；外层 span 供布局，内层交给 Typed 改写
export function TypedText({
	strings,
	typeSpeed = 48,
	backSpeed = 28,
	backDelay = 1400,
	loop = true,
	showCursor = true,
	cursorChar = "|",
	className,
	options,
}: TypedTextProps): JSX.Element {
	const hostRef = useRef<HTMLSpanElement>(null);
	// 用内容键而不是数组引用，避免父组件每次 render 新建 strings 导致重开打字
	const stringsKey = strings.join("\0");
	const optionsRef = useRef(options);
	optionsRef.current = options;

	useEffect(() => {
		const el = hostRef.current;
		if (!el || strings.length === 0) {
			return;
		}

		// 光标由组件自绘，关闭库内 cursor，避免双光标与全局 CSS 污染
		const typed = new Typed(el, {
			strings: stringsKey.split("\0"),
			typeSpeed,
			backSpeed,
			backDelay,
			loop,
			smartBackspace: true,
			showCursor: false,
			autoInsertCss: false,
			...optionsRef.current,
		});

		return () => {
			typed.destroy();
		};
	}, [stringsKey, strings.length, typeSpeed, backSpeed, backDelay, loop]);

	return (
		<span className={cn("inline-flex min-h-[1.25em] items-baseline", className)}>
			{/* Typed 会改写这个节点的 textContent */}
			<span ref={hostRef} />
			{showCursor ? (
				<span aria-hidden className="ml-0.5 inline-block animate-pulse text-current">
					{cursorChar}
				</span>
			) : null}
		</span>
	);
}
