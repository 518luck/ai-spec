"use client";

import {
	type ActionImpl,
	KBarAnimator,
	KBarPortal,
	KBarPositioner,
	KBarProvider,
	KBarResults,
	KBarSearch,
	useMatches,
} from "kbar";
import { cn } from "@/shared/lib/utils";
import { useKBarActions } from "../config/kbar-actions";

export function KBar({ children }: { children: React.ReactNode }) {
	return (
		<KBarProvider>
			<KBarComponent>{children}</KBarComponent>
		</KBarProvider>
	);
}

// 快捷键弹窗主组件
function KBarComponent({ children }: { children: React.ReactNode }) {
	useKBarActions();
	// /现在搜出来了哪些命令
	const { results } = useMatches();

	return (
		<>
			<KBarPortal>
				<KBarPositioner className="bg-background/70 backdrop-blur-xs">
					<KBarAnimator className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl">
						<div className="border-border border-b px-3 py-3">
							<KBarSearch
								defaultPlaceholder="输入命令或页面名称..."
								className="h-11 w-full border-input bg-transparent px-3 text-foreground text-sm outline-none placeholder:text-muted-foreground"
							/>
						</div>
						<KBarResults
							items={results}
							maxHeight={420}
							onRender={({ item, active }) =>
								typeof item === "string" ? (
									<div className="px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
										{item}
									</div>
								) : (
									<ResultItem action={item} active={active} />
								)
							}
						/>
					</KBarAnimator>
				</KBarPositioner>
			</KBarPortal>
			{children}
		</>
	);
}

// 渲染结果的列表项
function ResultItem({ action, active }: { action: ActionImpl; active: boolean }) {
	return (
		<div
			className={cn(
				"flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors",
				active ? "bg-accent text-accent-foreground" : "text-popover-foreground",
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="truncate font-medium text-sm">{action.name}</span>
				{action.subtitle ? (
					<span className="truncate text-muted-foreground text-xs">{action.subtitle}</span>
				) : null}
			</div>
			{action.shortcut?.length ? (
				<div className="flex items-center gap-1">
					{action.shortcut.map((key) => (
						<kbd
							key={key}
							className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-medium text-muted-foreground text-sm"
						>
							{key}
						</kbd>
					))}
				</div>
			) : null}
		</div>
	);
}
