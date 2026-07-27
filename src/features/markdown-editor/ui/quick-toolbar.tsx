"use client";

// # 快捷栏：快捷胶囊栏（可拖拽排序）+ 更多操作下拉（格式/显示设置/主题）
// > 偏好/预览/光标格式从 useEditorStore 订阅；editorRef 由编排层传入（执行 executeFormat）；对外只剩 editorRef + isExpanded

import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { Reorder } from "motion/react";
import { useTheme } from "next-themes";
import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { useInertialScroll, useScrollProgress } from "@/shared/hooks";
import { formatHotkey } from "@/shared/lib/format-hotkey";
import { cn } from "@/shared/lib/utils";
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
import { Kbd } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
	EDITOR_THEMES,
	executeFormat,
	MENU_GROUPS,
	type MenuItem,
	type ToolId,
} from "../config/editor";
import { resolveEditorColors } from "../lib/editor-colors";
import { useEditorStore } from "../model/editor-store";
import { isItemActive } from "../model/is-item-active";

// 工具动作类型：tool=格式化（用 editorRef）、display=视图设置开关、preview=切预览
type ToolbarActionType = "tool" | "display" | "preview";

// 快捷栏可见项：menu item 带上其所属分组类型
type ActiveToolbarItem = { type: ToolbarActionType } & MenuItem;

type QuickToolbarProps = {
	// CodeMirror 实例：tool 动作（加粗等）用它执行格式化
	editorRef: React.RefObject<ReactCodeMirrorRef | null>;
	// 是否放大：缩小时限制快捷栏最大宽度避免挤占（编排层布局参数）
	isExpanded: boolean;
};

// > 快捷栏：快捷胶囊 + 更多菜单；偏好从 store 取，tool 动作用 editorRef，display/preview 用 store action
export function QuickToolbar({ editorRef, isExpanded }: QuickToolbarProps): JSX.Element {
	const { resolvedTheme } = useTheme();
	// 订阅需要的字段 + actions（selector 细粒度订阅）
	const activeFormats = useEditorStore((s) => s.activeFormats);
	const editorSettings = useEditorStore((s) => s.editorSettings);
	const editorThemeId = useEditorStore((s) => s.editorThemeId);
	const isPreview = useEditorStore((s) => s.isPreview);
	const activeTools = useEditorStore((s) => s.activeTools);
	const setEditorThemeId = useEditorStore((s) => s.setEditorThemeId);
	const toggleDisplay = useEditorStore((s) => s.toggleDisplay);
	const togglePreview = useEditorStore((s) => s.togglePreview);
	const toggleTool = useEditorStore((s) => s.toggleTool);
	const reorderTools = useEditorStore((s) => s.reorderTools);
	// 派生：胶囊背景色（跟随主题）
	const { toolbarBgColor } = resolveEditorColors(editorThemeId, resolvedTheme === "dark");

	// 动作派发：tool→executeFormat(editorRef)、display→toggleDisplay、preview→togglePreview
	const handleItemAction = (type: ToolbarActionType, id: string): void => {
		if (type === "tool") {
			executeFormat(editorRef.current, id as ToolId);
		} else if (type === "display") {
			toggleDisplay(id);
		} else if (type === "preview") {
			togglePreview();
		}
	};

	// 当前模式下可见的菜单项（预览模式隐藏格式项）
	const currentMode = isPreview ? "preview" : "edit";
	const isVisible = (item: { showIn?: string }): boolean =>
		!item.showIn || item.showIn === "both" || item.showIn === currentMode;

	// 派生快捷栏可见项：按 activeTools 顺序 + showIn 过滤
	const allItems = MENU_GROUPS.flatMap((group) =>
		group.items.map((item) => ({ ...item, type: group.type as ToolbarActionType })),
	);
	const activeToolbarItems: ActiveToolbarItem[] = activeTools
		.map((id) => allItems.find((item) => item.id === id))
		.filter((item): item is ActiveToolbarItem => item !== undefined && isVisible(item));

	// 记录鼠标按下起点，区分点击和拖拽
	const startPos = useRef<{ x: number; y: number } | null>(null);
	// 快捷栏横滚容器：wheel 转横向 + 惯性缓动
	const toolbarScrollRef = useRef<HTMLDivElement>(null);
	const { handleWheel: handleToolbarWheel } = useInertialScroll(toolbarScrollRef, {
		direction: "horizontal",
	});
	const {
		scrollProgress: toolbarProgress,
		scrollable: toolbarScrollable,
		updateScrollProgress: updateToolbarProgress,
	} = useScrollProgress(toolbarScrollRef, { direction: "horizontal" });

	// ! 项数变化时元素直接卸载，commit 后需主动重算一次滚动遮罩进度
	// biome-ignore lint/correctness/useExhaustiveDependencies: activeToolbarItems 是项数变化信号，body 不直接读但需响应
	useEffect(() => {
		updateToolbarProgress();
	}, [activeToolbarItems, updateToolbarProgress]);

	return (
		<>
			{/* // @ 快捷操作胶囊栏：可拖拽排序，宽度随内容伸缩；box-content 避免图标贴圆角 */}
			{activeToolbarItems.length > 0 && (
				<div className="relative">
					<AnimatedSizeContainer
						width
						className="box-content rounded-full p-0.5"
						style={{ backgroundColor: toolbarBgColor }}
						transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
					>
						<div
							ref={toolbarScrollRef}
							onWheel={handleToolbarWheel}
							onScroll={updateToolbarProgress}
							className={cn(
								"overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
								!isExpanded && "max-w-42",
							)}
						>
							<Reorder.Group
								axis="x"
								values={activeToolbarItems}
								onReorder={(newItems) => reorderTools(newItems.map((i) => i.id))}
								className="flex items-center gap-0.5"
							>
								{activeToolbarItems.map((item) => {
									const isActive = isItemActive({
										group: { type: item.type, items: [] },
										item,
										activeFormats,
										editorSettings,
										isPreview,
									});
									return (
										<Tooltip key={item.id}>
											<TooltipTrigger
												render={
													<Reorder.Item
														value={item}
														layout
														whileDrag={{ scale: 1.15, zIndex: 10, cursor: "grabbing" }}
														className="shrink-0 cursor-pointer"
														onPointerDown={(e) =>
															(startPos.current = { x: e.clientX, y: e.clientY })
														}
														onPointerUp={(e) => {
															if (!startPos.current) return;
															const dx = Math.abs(e.clientX - startPos.current.x);
															const dy = Math.abs(e.clientY - startPos.current.y);
															// 位移 < 5px 视为点击，触发对应动作；否则视为拖拽
															if (dx < 5 && dy < 5) {
																handleItemAction(item.type, item.id);
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
											{/* // 胶囊悬浮提示：label + 快捷键（仅格式工具有 shortcut） */}
											<TooltipContent>
												{item.label}
												{item.shortcut ? <Kbd>{formatHotkey(item.shortcut)}</Kbd> : null}
											</TooltipContent>
										</Tooltip>
									);
								})}
							</Reorder.Group>
						</div>
					</AnimatedSizeContainer>
					{/* // 左右渐变遮罩：仅可滚动且对应方向有内容时显示 */}
					<div
						className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 rounded-l-full opacity-0 transition-opacity duration-200"
						style={{
							backgroundImage: `linear-gradient(to right, ${toolbarBgColor}, color-mix(in srgb, ${toolbarBgColor} 70%, transparent) 50%, transparent)`,
							opacity: toolbarScrollable && toolbarProgress > 0 ? 1 : 0,
						}}
					/>
					<div
						className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-full opacity-0 transition-opacity duration-200"
						style={{
							backgroundImage: `linear-gradient(to left, ${toolbarBgColor}, color-mix(in srgb, ${toolbarBgColor} 70%, transparent) 50%, transparent)`,
							opacity: toolbarScrollable && toolbarProgress < 1 ? 1 : 0,
						}}
					/>
				</div>
			)}

			{/* // @ 更多操作：Checkbox 控制是否加入快捷栏，点击文字执行对应动作 */}
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
							<HelpTooltip
								alignWithText
								content="勾选后将该操作加入顶部快捷栏，快捷栏可拖拽调整顺序"
							/>
						</span>
						<span className="flex-1 text-muted-foreground text-xs">操作</span>
					</div>
					<DropdownMenuSeparator />
					{/* // 先过滤出当前模式下有可见项的组，避免空组叠加出多余分隔线 */}
					{MENU_GROUPS.map((group) => ({ group, items: group.items.filter(isVisible) }))
						.filter((g) => g.items.length > 0)
						.map(({ group, items }, groupIndex) => (
							<DropdownMenuGroup key={group.type}>
								{groupIndex > 0 && <DropdownMenuSeparator />}
								{items.map((item) => (
									<div key={item.id} className="flex items-center rounded-sm px-2 py-1.5 text-sm">
										<Checkbox
											checked={activeToolbarItems.some((t) => t.id === item.id)}
											onCheckedChange={() => toggleTool(item.id)}
											className="mr-10 w-4 shrink-0 cursor-pointer"
										/>
										<button
											type="button"
											className={cn(
												"flex flex-1 cursor-pointer items-center rounded-sm px-1 py-0.5",
												isItemActive({
													group,
													item,
													activeFormats,
													editorSettings,
													isPreview,
												}) && "bg-accent",
											)}
											onClick={() => handleItemAction(group.type as ToolbarActionType, item.id)}
										>
											<item.icon className="mr-2 size-4" />
											{item.label}
											{item.description && (
												<span className="ml-1.5">
													<HelpTooltip content={item.description} />
												</span>
											)}
											{/* // 行尾右对齐快捷键提示（仅格式工具有 shortcut） */}
											{item.shortcut ? (
												<Kbd className="ml-auto">{formatHotkey(item.shortcut)}</Kbd>
											) : null}
										</button>
									</div>
								))}
							</DropdownMenuGroup>
						))}
					{/* // 主题选择：仅编辑模式显示（预览是 Markdown 渲染，与编辑器主题无关） */}
					{!isPreview && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger>主题</DropdownMenuSubTrigger>
									<DropdownMenuSubContent>
										{EDITOR_THEMES.map((theme) => (
											<DropdownMenuItem key={theme.id} onClick={() => setEditorThemeId(theme.id)}>
												{theme.label}
												{theme.id === editorThemeId && <Icons.check className="ml-auto size-4" />}
											</DropdownMenuItem>
										))}
									</DropdownMenuSubContent>
								</DropdownMenuSub>
							</DropdownMenuGroup>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
