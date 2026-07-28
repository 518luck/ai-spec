"use client";

// # 侧边栏底部的命令面板入口：点击唤起 kbar 面板，紧凑态退化为纯图标 + Tooltip

import { useKBar } from "kbar";
import type { JSX } from "react";

import { HOTKEYS } from "@/shared/configs/hotkeys.config";
import { useMounted } from "@/shared/hooks";
import { formatHotkey } from "@/shared/lib/format-hotkey";
import { Icons } from "@/shared/ui/icons";
import { Kbd } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useSidebarContext } from "../model/sidebar-context";

// 命令面板入口按钮：展开态显示「搜索命令 ⌘K」整行，紧凑态只留图标并用 Tooltip 补充说明
export function CommandEntry(): JSX.Element {
	const { query } = useKBar();
	const { collapsed } = useSidebarContext();
	const mounted = useMounted();

	// 挂载后按平台显示真实键位（⌘K / Ctrl+K）；SSR 首帧用静态 label 避免水合不一致
	const paletteLabel = mounted
		? formatHotkey(HOTKEYS.commandPalette.combo)
		: HOTKEYS.commandPalette.label;

	// 紧凑态：图标按钮 + Tooltip
	if (collapsed) {
		return (
			<Tooltip>
				<TooltipTrigger
					render={
						<button
							type="button"
							aria-label="搜索命令"
							onClick={() => query.toggle()}
							className="flex size-9 shrink-0 cursor-pointer items-center justify-center self-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						>
							<Icons.search className="size-4" />
						</button>
					}
				/>
				<TooltipContent side="right" showArrow={false}>
					搜索命令 <Kbd>{paletteLabel}</Kbd>
				</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<button
			type="button"
			onClick={() => query.toggle()}
			className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sidebar-foreground/90 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
		>
			<Icons.search className="size-4 shrink-0 opacity-60" />
			<span className="min-w-0 flex-1 truncate text-left">搜索命令</span>
			<Kbd>{paletteLabel}</Kbd>
		</button>
	);
}
