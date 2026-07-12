"use client";

import { motion } from "motion/react";
import type { JSX } from "react";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { EDITOR_THEMES, MENU_GROUPS, type MenuItem } from "../../config/editor-dialog";

type EditorToolbarProps = {
	// 从内容首行提取的标题
	title: string;
	// 编辑器背景色（跟随主题）
	editorBgColor: string;
	// 快捷栏胶囊背景色（跟随主题）
	toolbarBgColor: string;
	// 胶囊中显示的操作项
	activeToolbarItems: ({ type: string } & MenuItem)[];
	// 光标位置正在使用的格式 id 集合
	activeFormats: Set<string>;
	// 编辑器视图设置
	editorSettings: { lineNumbers: boolean; foldGutter: boolean; highlightActiveLine: boolean };
	// 当前主题 id
	editorThemeId: string;
	// 是否处于预览模式
	isPreview: boolean;
	// 是否放大
	isExpanded: boolean;
	// 点击胶囊按钮或菜单文字时的回调
	onItemAction: (type: "tool" | "view" | "preview", id: string) => void;
	// 点击 Checkbox 时的回调（加入/移出快捷栏）
	onCheckboxToggle: (id: string) => void;
	// 切换主题
	onThemeChange: (id: string) => void;
	// 切换放大/缩小
	onExpandToggle: () => void;
};

// 顶部导航栏：标题（左）+ 操作栏（胶囊按钮 + 下拉菜单 + 主题选择 + 放大）
export function EditorToolbar({
	title,
	editorBgColor,
	toolbarBgColor,
	activeToolbarItems,
	activeFormats,
	editorSettings,
	editorThemeId,
	isPreview,
	isExpanded,
	onItemAction,
	onCheckboxToggle,
	onThemeChange,
	onExpandToggle,
}: EditorToolbarProps): JSX.Element {
	// 当前模式下可见的菜单项
	const currentMode = isPreview ? "preview" : "edit";
	const isVisible = (item: { showIn?: string }): boolean =>
		!item.showIn || item.showIn === "both" || item.showIn === currentMode;

	return (
		<div
			className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-2 border-border/50 border-b px-4 backdrop-blur-[1.5px]"
			style={{ background: `linear-gradient(to bottom, ${editorBgColor}, ${editorBgColor}1A)` }}
		>
			{/* 标题 */}
			<span
				className={`truncate font-semibold text-base ${isExpanded ? "max-w-[40%]" : "max-w-[20%]"}`}
			>
				{title}
			</span>

			<div className="ml-auto flex items-center gap-2">
				{/* 快捷操作工具栏：椭圆背景，放大时不限宽度 */}
				{activeToolbarItems.length > 0 && (
					<motion.div
						layout
						className="rounded-full p-0.5"
						style={{ backgroundColor: toolbarBgColor }}
						transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
					>
						<ScrollArea
							orientation="horizontal"
							className={isExpanded ? "" : "max-w-76"}
							scrollbarClassName="mx-2"
						>
							<div className="flex items-center gap-0.5">
								{activeToolbarItems.map((item) => {
									const isActive =
										item.type === "tool"
											? activeFormats.has(item.id)
											: item.type === "preview"
												? isPreview
												: Boolean(editorSettings[item.id as keyof typeof editorSettings]);
									return (
										<Tooltip key={item.id}>
											<TooltipTrigger
												render={
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label={item.label}
														className={`shrink-0 rounded-full ${
															isActive
																? "bg-primary/15! text-primary hover:bg-primary/25"
																: "hover:bg-foreground/20!"
														}`}
														onClick={() =>
															onItemAction(item.type as "tool" | "view" | "preview", item.id)
														}
													/>
												}
											>
												<item.icon className="size-4" />
											</TooltipTrigger>
											<TooltipContent>{item.label}</TooltipContent>
										</Tooltip>
									);
								})}
							</div>
						</ScrollArea>
					</motion.div>
				)}

				{/* 更多操作：下拉面板，Checkbox 控制是否加入快捷栏，点击文字执行对应操作 */}
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button variant="ghost" size="icon-sm" aria-label="更多操作">
								<Icons.more className="size-4" />
							</Button>
						}
					/>
					<DropdownMenuContent align="start" className="min-w-45">
						{/* 表头：说明 Checkbox 列的含义 */}
						<div className="flex items-center px-2 py-1.5">
							<span className="mr-4 flex shrink-0 items-center text-muted-foreground text-xs">
								显示
								<HelpTooltip content="勾选后将该操作加入顶部快捷栏" />
							</span>
							<span className="flex-1 text-muted-foreground text-xs">操作</span>
						</div>
						<DropdownMenuSeparator />
						{MENU_GROUPS.map((group, groupIndex) => (
							<DropdownMenuGroup key={group.type}>
								{groupIndex > 0 && <DropdownMenuSeparator />}
								{group.items.filter(isVisible).map((item) => (
									<div key={item.id} className="flex items-center rounded-sm px-2 py-1.5 text-sm">
										<Checkbox
											checked={activeToolbarItems.some((t) => t.id === item.id)}
											onCheckedChange={() => onCheckboxToggle(item.id)}
											className="mr-10 w-4 shrink-0 cursor-pointer"
										/>
										<button
											type="button"
											className={`flex flex-1 cursor-pointer items-center rounded-sm px-1 py-0.5 ${
												group.type === "tool" && activeFormats.has(item.id)
													? "bg-accent"
													: group.type === "view" &&
															editorSettings[item.id as keyof typeof editorSettings]
														? "bg-accent"
														: group.type === "preview" && isPreview
															? "bg-accent"
															: ""
											}`}
											onClick={() => onItemAction(group.type, item.id)}
										>
											<item.icon className="mr-2 size-4" />
											{item.label}
											{item.description && (
												<span className="ml-1.5">
													<HelpTooltip content={item.description} />
												</span>
											)}
										</button>
									</div>
								))}
							</DropdownMenuGroup>
						))}
						{/* 主题选择：子菜单 */}
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>主题</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									{EDITOR_THEMES.map((theme) => (
										<DropdownMenuItem key={theme.id} onClick={() => onThemeChange(theme.id)}>
											{theme.label}
											{theme.id === editorThemeId && <Icons.check className="ml-auto size-4" />}
										</DropdownMenuItem>
									))}
								</DropdownMenuSubContent>
							</DropdownMenuSub>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={isExpanded ? "缩小" : "放大"}
					onClick={onExpandToggle}
				>
					{isExpanded ? <Icons.minimize className="size-4" /> : <Icons.expand className="size-4" />}
				</Button>
			</div>
		</div>
	);
}
