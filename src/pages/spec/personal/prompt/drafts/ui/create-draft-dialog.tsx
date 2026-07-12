"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { syntaxTree } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { Decoration, EditorView, type ViewUpdate } from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { type JSX, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { createDraft } from "@/entities/prompt";
import { getCookie, setCookie } from "@/shared/lib/cookie/client-cookie";
import { createDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
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
import { Spinner } from "@/shared/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
	defaultEditorSettings,
	EDITOR_THEMES,
	executeFormat,
	MENU_GROUPS,
	NODE_NAME_TO_TOOL_ID,
	type ToolId,
} from "../config/editor-dialog";
import "../styles/codemirror.css";

type CreateDraftDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

// 从语法树解析光标位置处于哪些格式内，返回活跃的工具 id 集合
const resolveActiveFormats = (view: ReactCodeMirrorRef | null): Set<string> => {
	if (!view?.state) return new Set();

	const pos = view.state.selection.main.head;
	const tree = syntaxTree(view.state);
	const node = tree.resolveInner(pos);
	const active = new Set<string>();

	// 从光标处向上遍历语法树，收集所有匹配的格式节点
	let current: typeof node | null = node;
	while (current) {
		const toolId = NODE_NAME_TO_TOOL_ID[current.name];
		if (toolId) active.add(toolId);
		current = current.parent;
	}

	return active;
};

// 创建草稿弹窗：全屏 CodeMirror 编辑器，顶部导航栏自动提取首行作为标题，关闭时有内容则自动保存
export function CreateDraftDialog({ open, onOpenChange }: CreateDraftDialogProps): JSX.Element {
	const router = useRouter();
	const { resolvedTheme } = useTheme();
	const editorRef = useRef<ReactCodeMirrorRef>(null);
	const [content, setContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	// 是否处于预览模式：true 时用 react-markdown 渲染，false 时显示 CodeMirror 编辑器
	const [isPreview, setIsPreview] = useState(false);

	// 编辑器偏好默认值：快捷栏操作、视图设置、主题
	const defaultToolbar = ["bold", "italic"];
	const defaultThemeId = "vscode";

	// 编辑器偏好：持久化到单个 cookie（ai-spec.editor-preferences）
	const [activeTools, setActiveTools] = useState<string[]>(defaultToolbar);
	const [editorSettings, setEditorSettings] = useState(defaultEditorSettings);
	const [editorThemeId, setEditorThemeId] = useState(defaultThemeId);

	// 挂载后从 cookie 读取全部偏好
	useEffect(() => {
		const raw = getCookie("ai-spec.editor-preferences");
		if (!raw) return;
		try {
			const prefs = JSON.parse(raw) as {
				toolbar?: string[];
				settings?: typeof defaultEditorSettings;
				theme?: string;
			};
			if (Array.isArray(prefs.toolbar)) setActiveTools(prefs.toolbar);
			if (prefs.settings) setEditorSettings({ ...defaultEditorSettings, ...prefs.settings });
			if (prefs.theme) setEditorThemeId(prefs.theme);
		} catch {
			// cookie 解析失败时用默认值
		}
	}, []);

	// 把当前全部偏好写入 cookie
	const savePreferences = (overrides: {
		toolbar?: string[];
		settings?: typeof defaultEditorSettings;
		theme?: string;
	}): void => {
		const prefs = {
			toolbar: overrides.toolbar ?? activeTools,
			settings: overrides.settings ?? editorSettings,
			theme: overrides.theme ?? editorThemeId,
		};
		setCookie("ai-spec.editor-preferences", JSON.stringify(prefs), {
			path: "/",
			maxAge: 31536000,
			sameSite: "lax",
		});
	};

	// 切换某个快捷操作的显示/隐藏，同时持久化
	const toggleTool = (id: string): void => {
		setActiveTools((prev) => {
			const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
			savePreferences({ toolbar: next });
			return next;
		});
	};

	// 光标位置正在使用的格式 id 集合（用于高亮菜单项和胶囊按钮）
	const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
	// 弹窗是否放大：放大时占满更大尺寸，再点缩小回去
	const [isExpanded, setIsExpanded] = useState(false);

	// 更新视图设置并持久化
	const updateEditorSettings = (settings: typeof defaultEditorSettings): void => {
		setEditorSettings(settings);
		savePreferences({ settings });
	};

	// 切换编辑器主题并持久化
	const handleThemeChange = (id: string): void => {
		setEditorThemeId(id);
		savePreferences({ theme: id });
	};

	// 当前生效的主题变体（亮色或暗色）及背景色
	const currentTheme = EDITOR_THEMES.find((t) => t.id === editorThemeId) ?? EDITOR_THEMES[0];
	const isDark = resolvedTheme === "dark";
	const editorTheme = isDark ? currentTheme.dark : currentTheme.light;
	const editorBgColor = isDark ? currentTheme.darkBg : currentTheme.lightBg;
	const toolbarBgColor = isDark ? currentTheme.darkToolbarBg : currentTheme.lightToolbarBg;

	// Markdown 语法扩展（含代码块内语言高亮）+ 首行标题装饰，用 useMemo 缓存避免每次渲染重建
	const extensions = useMemo(
		() => [
			markdown({ base: markdownLanguage, codeLanguages: languages }),
			// 给第一行加 first-line-title class，配合 CSS 放大字号和加粗
			EditorView.decorations.of(() =>
				Decoration.set([Decoration.line({ class: "first-line-title" }).range(0)]),
			),
		],
		[],
	);

	// 编辑器更新时重新解析光标位置的活跃格式
	const handleUpdate = (viewUpdate: ViewUpdate): void => {
		if (viewUpdate.docChanged || viewUpdate.selectionSet) {
			setActiveFormats(resolveActiveFormats(editorRef.current));
		}
	};

	// 当前模式下可见的菜单项 id 集合（根据 showIn 过滤）
	const currentMode = isPreview ? "preview" : "edit";
	const isVisible = (item: { showIn?: string }): boolean =>
		!item.showIn || item.showIn === "both" || item.showIn === currentMode;

	// 当前在椭圆胶囊中显示的操作项（保持配置顺序，带 type 信息供点击时区分行为）
	const activeToolbarItems = MENU_GROUPS.flatMap((group) =>
		group.items
			.filter((item) => activeTools.includes(item.id) && isVisible(item))
			.map((item) => ({ ...item, type: group.type })),
	);

	// 所有菜单项统一：Checkbox 是否勾选 = 是否在快捷栏
	const isItemChecked = (id: string): boolean => activeTools.includes(id);

	// 点击左侧复选框：统一加入/移出快捷栏
	const handleCheckboxToggle = (id: string): void => {
		toggleTool(id);
	};

	// 点击右侧文字：tool → 执行 Markdown 格式化，view → 开关编辑器设置，preview → 切换预览模式
	const handleItemAction = (type: "tool" | "view" | "preview", id: string): void => {
		if (type === "tool") {
			executeFormat(editorRef.current, id as ToolId);
		} else if (type === "view") {
			updateEditorSettings({
				...editorSettings,
				[id]: !editorSettings[id as keyof typeof editorSettings],
			});
		} else if (type === "preview") {
			setIsPreview((v) => !v);
		}
	};

	// 从内容首行提取标题，为空时显示占位文案
	const title = content.split("\n")[0]?.trim() || "无标题草稿";

	// 关闭弹窗：有内容则保存后关闭，空内容直接关闭
	const handleClose = async (): Promise<void> => {
		const trimmed = content.trim();

		// 空内容直接关闭，不创建草稿
		if (!trimmed) {
			setContent("");
			onOpenChange(false);
			return;
		}

		// 有内容：预校验后调 API 创建
		const parsed = createDraftDtoSchema.safeParse({
			name: content.split("\n")[0]?.trim() || undefined,
			content,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入草稿内容");
			return;
		}

		setIsSaving(true);
		try {
			await createDraft(parsed.data);
			toast.success("草稿已创建");
			setContent("");
			router.refresh();
			onOpenChange(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建失败，请稍后重试");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				// 关闭时走保存逻辑，打开时直接放行
				if (!next) {
					void handleClose();
				} else {
					onOpenChange(next);
				}
			}}
		>
			<DialogContent
				showCloseButton={false}
				scrollable={false}
				render={
					<motion.div
						layout
						transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
						className="flex flex-col overflow-hidden p-0"
						style={{
							maxHeight: "85vh",
							maxWidth: "calc(100% - 2rem)",
						}}
						initial={false}
						animate={{
							width: isExpanded ? "73rem" : "32rem",
							height: isExpanded ? "40rem" : "32rem",
						}}
					/>
				}
			>
				{/* 编辑器/预览区域：占满整个弹窗，预览模式时用 react-markdown 渲染 */}
				<div className="min-h-0 flex-1 overflow-auto">
					{isPreview ? (
						<article className="prose prose-sm dark:prose-invert max-w-none p-4 pt-12">
							<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
						</article>
					) : (
						<CodeMirror
							ref={editorRef}
							value={content}
							onChange={setContent}
							onUpdate={handleUpdate}
							extensions={extensions}
							theme={editorTheme}
							placeholder="写下你的想法…"
							height="100%"
							className="h-full text-sm"
							basicSetup={editorSettings}
						/>
					)}
				</div>

				{/* 顶部导航栏：标题（左）+ 操作栏（右），浮在编辑器上方，半透明毛玻璃 */}
				<div
					className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-2 border-border/50 border-b px-4 backdrop-blur-[1.5px]"
					style={{ background: `linear-gradient(to bottom, ${editorBgColor}, ${editorBgColor}1A)` }}
				>
					<span className="max-w-[20%] truncate font-semibold text-base">{title}</span>

					{/* 操作栏：快捷操作（椭圆胶囊）+ 更多操作 + 放大 */}
					<div className="ml-auto flex items-center gap-2">
						{/* 快捷操作工具栏：椭圆背景，max-w-76 自动触发横向滚动 */}
						{activeToolbarItems.length > 0 && (
							<div className="rounded-full p-0.5" style={{ backgroundColor: toolbarBgColor }}>
								<ScrollArea orientation="horizontal" className="max-w-76" scrollbarClassName="mx-2">
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
																onClick={() => handleItemAction(item.type, item.id)}
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
							</div>
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
										{/* 组与组之间插入分隔线 */}
										{groupIndex > 0 && <DropdownMenuSeparator />}
										{group.items.filter(isVisible).map((item) => (
											<div
												key={item.id}
												className="flex items-center rounded-sm px-2 py-1.5 text-sm"
											>
												{/* 左侧复选框：统一加入/移出快捷栏 */}
												<Checkbox
													checked={isItemChecked(item.id)}
													onCheckedChange={() => handleCheckboxToggle(item.id)}
													className="mr-10 w-4 shrink-0 cursor-pointer"
												/>
												{/* 右侧文字区域：点击执行操作；tool 组光标在格式内时高亮，view 组设置开启时高亮 */}
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
													onClick={() => handleItemAction(group.type, item.id)}
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
								{/* 主题选择：子菜单，点击展开主题列表 */}
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuSub>
										<DropdownMenuSubTrigger>主题</DropdownMenuSubTrigger>
										<DropdownMenuSubContent>
											{EDITOR_THEMES.map((theme) => (
												<DropdownMenuItem
													key={theme.id}
													onClick={() => handleThemeChange(theme.id)}
												>
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
							onClick={() => setIsExpanded((v) => !v)}
						>
							{isExpanded ? (
								<Icons.minimize className="size-4" />
							) : (
								<Icons.expand className="size-4" />
							)}
						</Button>
					</div>
				</div>

				{/* 保存中遮罩：关闭弹窗时正在保存，覆盖整个弹窗阻止交互 */}
				{isSaving && (
					<div className="absolute inset-0 z-50 flex items-center justify-center gap-2 bg-popover/80 backdrop-blur-sm">
						<Spinner className="size-5" />
						<span className="text-sm">保存中...</span>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
