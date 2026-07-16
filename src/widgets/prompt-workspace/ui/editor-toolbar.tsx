"use client";
// # 编辑器顶部导航栏 —— 标题 + 快捷工具栏 + 更多操作下拉 + 主题切换 + 放大

import { AnimatePresence, Reorder } from "motion/react";
import type { JSX } from "react";
import { useRef } from "react";

import { AnimatedSizeContainer } from "@/shared/ui/animated-size-container";
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
import { FolderCombobox } from "@/widgets/folder-combobox";
import { EDITOR_THEMES, MENU_GROUPS, type MenuItem } from "../config/editor";

// 编辑器展示状态 + 主题/展开回调：状态与其对应回调同组，方便后续扩展（如版本处理）
export type EditorState = {
	// 编辑器背景色（跟随主题）
	editorBgColor: string;
	// 快捷栏胶囊背景色（跟随主题）
	toolbarBgColor: string;
	// 编辑器视图设置
	editorSettings: { lineNumbers: boolean; foldGutter: boolean; highlightActiveLine: boolean };
	// 当前主题 id
	editorThemeId: string;
	// 光标位置正在使用的格式 id 集合
	activeFormats: Set<string>;
	// 是否处于预览模式
	isPreview: boolean;
	// 是否放大
	isExpanded: boolean;
	// 切换主题
	onThemeChange: (id: string) => void;
	// 切换放大/缩小
	onExpandToggle: () => void;
};

// 快捷工具胶囊的行为：操作项 + 三个回调
export type QuickToolbarProps = {
	// 胶囊中显示的操作项
	items: ({ type: string } & MenuItem)[];
	// 点击胶囊按钮或菜单文字时的回调
	onAction: (type: "tool" | "display" | "preview", id: string) => void;
	// 点击 Checkbox 时的回调（加入/移出快捷栏）
	onToggle: (id: string) => void;
	// 拖拽排序后的回调
	onReorder: (newOrder: string[]) => void;
};

// 文件夹选择：resourceType 决定拉取哪类文件夹 + 创建时归属
export type FolderConfigProps = {
	resourceType: string;
	value: string | undefined;
	onChange: (folderId: string | undefined) => void;
};

type EditorToolbarProps = {
	// 从内容首行提取的标题
	title: string;
	// 编辑器展示状态 + 主题/展开回调
	editorState: EditorState;
	// 快捷工具胶囊
	quickToolbar: QuickToolbarProps;
	// 文件夹选择
	folder: FolderConfigProps;
};

// > 按当前模式（编辑/预览）过滤菜单项的可见性
export function EditorToolbar({
	title,
	editorState,
	quickToolbar,
	folder,
}: EditorToolbarProps): JSX.Element {
	const {
		editorBgColor,
		toolbarBgColor,
		editorSettings,
		editorThemeId,
		activeFormats,
		isPreview,
		isExpanded,
		onThemeChange,
		onExpandToggle,
	} = editorState;
	const {
		items: activeToolbarItems,
		onAction: onItemAction,
		onToggle: onCheckboxToggle,
		onReorder,
	} = quickToolbar;
	// 当前模式下可见的菜单项
	const currentMode = isPreview ? "preview" : "edit";
	const isVisible = (item: { showIn?: string }): boolean =>
		!item.showIn || item.showIn === "both" || item.showIn === currentMode;
	// 记录鼠标按下的起点，用于区分点击和拖拽
	const startPos = useRef<{ x: number; y: number } | null>(null);

	return (
		<div
			className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-2 border-border/50 border-b px-4 backdrop-blur-[1.5px]"
			style={{ background: `linear-gradient(to bottom, ${editorBgColor}, ${editorBgColor}1A)` }}
		>
			{/* 标题 */}
			<span className={`truncate font-semibold text-base ${isExpanded ? "w-64" : "w-32"}`}>
				{title}
			</span>

			{/* // @ 文件夹选择：缩小空间时只显示图标，放大后显示完整文字 */}
			<FolderCombobox
				resourceType={folder.resourceType}
				value={folder.value}
				onChange={folder.onChange}
				className="shrink-0"
				iconOnly={!isExpanded}
			/>

			<div className="ml-auto flex items-center gap-2">
				{/* // @ 快捷操作工具栏：可拖拽排序，宽度跟随内容伸缩；box-content 避免图标贴圆角 */}
				{activeToolbarItems.length > 0 && (
					<AnimatedSizeContainer
						width
						className="box-content rounded-full p-0.5"
						style={{ backgroundColor: toolbarBgColor }}
						transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
					>
						<ScrollArea
							orientation="horizontal"
							className={isExpanded ? "" : "max-w-42"}
							scrollbarClassName="mx-4"
						>
							<Reorder.Group
								axis="x"
								values={activeToolbarItems}
								onReorder={(newItems) => onReorder(newItems.map((i) => i.id))}
								className="flex items-center gap-0.5"
							>
								<AnimatePresence mode="popLayout">
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
														<Reorder.Item
															value={item}
															layout
															initial={{ opacity: 0, scale: 0 }}
															animate={{ opacity: 1, scale: 1 }}
															exit={{ opacity: 0, scale: 0 }}
															transition={{ type: "spring", stiffness: 400, damping: 32 }}
															whileDrag={{ scale: 1.15, zIndex: 10, cursor: "grabbing" }}
															className="shrink-0 cursor-pointer"
															onPointerDown={(e) =>
																(startPos.current = { x: e.clientX, y: e.clientY })
															}
															onPointerUp={(e) => {
																if (!startPos.current) return;
																const dx = Math.abs(e.clientX - startPos.current.x);
																const dy = Math.abs(e.clientY - startPos.current.y);
																// 位移 < 5px 视为点击，触发对应操作；否则视为拖拽
																if (dx < 5 && dy < 5) {
																	onItemAction(
																		item.type as "tool" | "display" | "preview",
																		item.id,
																	);
																}
																startPos.current = null;
															}}
														/>
													}
												>
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label={item.label}
														className={`pointer-events-none rounded-full ${
															isActive
																? "bg-primary/15! text-primary hover:bg-primary/25"
																: "hover:bg-foreground/20!"
														}`}
													>
														<item.icon className="size-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>{item.label}</TooltipContent>
											</Tooltip>
										);
									})}
								</AnimatePresence>
							</Reorder.Group>
						</ScrollArea>
					</AnimatedSizeContainer>
				)}

				{/* // @ 更多操作：Checkbox 控制是否加入快捷栏，点击文字执行对应操作 */}
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
							<span className="mr-4 flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
								显示
								<HelpTooltip alignWithText content="勾选后将该操作加入顶部快捷栏，快捷栏可拖拽调整顺序" />
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
													: group.type === "display" &&
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
