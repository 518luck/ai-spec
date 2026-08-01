"use client";

import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { SearchIcon } from "lucide-react";
import type * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/utils";
import { ScrollMask } from "@/shared/ui/scroll-mask";
import { InputGroup, InputGroupAddon } from "@/shared/ui/input-group";
import { useScrollProgress } from "@/shared/hooks";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn(
				"flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div data-slot="command-input-wrapper" className="p-1 pb-0">
			<InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
				<CommandPrimitive.Input
					data-slot="command-input"
					className={cn(
						"w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					{...props}
				/>
				<InputGroupAddon>
					<SearchIcon className="size-4 shrink-0 opacity-50" />
				</InputGroupAddon>
			</InputGroup>
		</div>
	);
}

function CommandList({
	className,
	ref: externalRef,
	onScroll: externalOnScroll,
	showMask = false,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List> & {
	showMask?: boolean;
}) {
	const listRef = useRef<HTMLDivElement>(null);
	const { scrollProgress, scrollable, updateScrollProgress } = useScrollProgress(listRef);

	// > 监听子节点变化：数据到达时容器可见高度被 max-h 钉死（ResizeObserver 失效），
	// > 且 cmdk 的 item 注册晚于 React 渲染，用 MutationObserver 检测 DOM 变更后双 rAF 重算进度
	useEffect(() => {
		if (!showMask) return;
		const el = listRef.current;
		if (!el) return;

		const observer = new MutationObserver(() => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => updateScrollProgress());
			});
		});
		observer.observe(el, { childList: true, subtree: true });

		return () => observer.disconnect();
	}, [showMask, updateScrollProgress]);

	// 不需要遮罩时保持原行为，直接透传
	if (!showMask) {
		return (
			<CommandPrimitive.List
				ref={externalRef}
				data-slot="command-list"
				className={cn(
					"scrollbar-thin max-h-72 scroll-py-1 overflow-y-auto overflow-x-hidden outline-none",
					className,
				)}
				onScroll={externalOnScroll}
				{...props}
			/>
		);
	}

	// > 开启遮罩：内部接管 ref + onScroll，底部渲染 CommandScrollMask
	return (
		<div className="relative">
			<CommandPrimitive.List
				ref={listRef}
				data-slot="command-list"
				className={cn(
					"scrollbar-thin max-h-72 scroll-py-1 overflow-y-auto overflow-x-hidden outline-none",
					className,
				)}
				onScroll={updateScrollProgress}
				{...props}
			/>
			<CommandScrollMask
				scrollProgress={scrollProgress}
				enabled={scrollable}
				onSearchChange={updateScrollProgress}
			/>
		</div>
	);
}

function CommandEmpty({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className={cn("py-6 text-center text-sm", className)}
			{...props}
		/>
	);
}

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			data-slot="command-group"
			className={cn(
				"overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:text-xs",
				className,
			)}
			{...props}
		/>
	);
}

function CommandSeparator({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
	return (
		<CommandPrimitive.Separator
			data-slot="command-separator"
			className={cn("-mx-1 h-px w-auto bg-border", className)}
			{...props}
		/>
	);
}

function CommandItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(
				"group/command-item relative flex cursor-default select-none items-center gap-2 in-data-[slot=dialog-content]:rounded-lg! rounded-sm px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-selected:bg-muted data-selected:text-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-selected:**:[svg]:text-foreground",
				className,
			)}
			{...props}
		>
			{children}
		</CommandPrimitive.Item>
	);
}

// > cmdk 列表专用底部渐变遮罩：订阅搜索词驱动 rAF 重算，跨过 cmdk 过滤后的 DOM 重排帧再读真实尺寸
// ! 必须在 Command 内部使用（依赖 useCommandState），由 CommandList 在 showMask 时内部调用，不对外导出
function CommandScrollMask({
	scrollProgress,
	onSearchChange,
	enabled = true,
	maskColor = "var(--popover)",
	className,
}: {
	scrollProgress: number;
	onSearchChange: () => void;
	enabled?: boolean;
	maskColor?: string;
	className?: string;
}): React.JSX.Element | null {
	const search = useCommandState((state) => state.search);

	// biome-ignore lint/correctness/useExhaustiveDependencies: search 作为 cmdk 过滤的触发信号
	useEffect(() => {
		const id = requestAnimationFrame(onSearchChange);
		return () => cancelAnimationFrame(id);
	}, [search, onSearchChange]);

	return (
		<ScrollMask
			scrollProgress={scrollProgress}
			enabled={enabled}
			maskColor={maskColor}
			className={className}
		/>
	);
}

export {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandSeparator,
};
