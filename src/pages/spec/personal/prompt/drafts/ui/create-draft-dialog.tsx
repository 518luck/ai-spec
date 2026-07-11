"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { syntaxTree } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { Decoration, EditorView, type ViewUpdate } from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { type JSX, useEffect, useMemo, useRef, useState } from "react";
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
	// 当前在椭圆胶囊中显示的快捷操作 id 列表
	const [activeTools, setActiveTools] = useState<string[]>(["bold", "italic"]);
	// 光标位置正在使用的格式 id 集合（用于高亮菜单项和胶囊按钮）
	const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

	// 编辑器视图设置：持久化到 cookie，和主题 cookie 统一管理方式
	const [editorSettings, setEditorSettings] = useState(defaultEditorSettings);

	// 挂载后从 cookie 读取用户上次的设置
	useEffect(() => {
		const raw = getCookie("ai-spec.editor-settings");
		if (raw) {
			try {
				setEditorSettings({ ...defaultEditorSettings, ...JSON.parse(raw) });
			} catch {
				// cookie 解析失败时用默认值
			}
		}
	}, []);

	// 更新设置并写入 cookie
	const updateEditorSettings = (settings: typeof defaultEditorSettings): void => {
		setEditorSettings(settings);
		setCookie("ai-spec.editor-settings", JSON.stringify(settings), {
			path: "/",
			maxAge: 31536000,
			sameSite: "lax",
		});
	};

	// 编辑器主题：持久化到 cookie，跟随应用明暗切换亮/暗变体
	const [editorThemeId, setEditorThemeId] = useState("vscode");

	useEffect(() => {
		const saved = getCookie("ai-spec.editor-theme");
		if (saved) setEditorThemeId(saved);
	}, []);

	const handleThemeChange = (id: string): void => {
		setEditorThemeId(id);
		setCookie("ai-spec.editor-theme", id, { path: "/", maxAge: 31536000, sameSite: "lax" });
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

	// 切换某个快捷操作的显示/隐藏
	const toggleTool = (id: string): void => {
		setActiveTools((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
	};

	// 当前在椭圆胶囊中显示的操作项（保持配置顺序，带 type 信息供点击时区分行为）
	const activeToolbarItems = MENU_GROUPS.flatMap((group) =>
		group.items
			.filter((item) => activeTools.includes(item.id))
			.map((item) => ({ ...item, type: group.type })),
	);

	// 所有菜单项统一：Checkbox 是否勾选 = 是否在快捷栏
	const isItemChecked = (id: string): boolean => activeTools.includes(id);

	// 点击左侧复选框：统一加入/移出快捷栏
	const handleCheckboxToggle = (id: string): void => {
		toggleTool(id);
	};

	// 点击右侧文字：tool → 执行 Markdown 格式化，view → 开关编辑器设置（持久化到 cookie）
	const handleItemAction = (type: "tool" | "view", id: string): void => {
		if (type === "tool") {
			executeFormat(editorRef.current, id as ToolId);
		} else {
			updateEditorSettings({
				...editorSettings,
				[id]: !editorSettings[id as keyof typeof editorSettings],
			});
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
				className="flex aspect-square max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-lg"
			>
				{/* 编辑器区域：占满整个弹窗（含导航栏下方区域），CodeMirror 内部 scroller 自行滚动 */}
				<div className="min-h-0 flex-1 overflow-hidden">
					<CodeMirror
						ref={editorRef}
						value={content} // 编辑器内容（受控值，绑定 React state）
						onChange={setContent} // 内容变化时同步到 state
						onUpdate={handleUpdate} // 选区/文档变化时重新解析活跃格式
						extensions={extensions} // Markdown 语法支持（含首行标题放大装饰）
						theme={editorTheme} // 编辑器主题，跟随应用明暗切换亮/暗变体
						placeholder="写下你的想法…" // 空内容时的占位文案
						height="100%" // 编辑器内部滚动容器高度，设为 100% 由外层 div 的 flex-1 撑满
						className="h-full text-sm" // h-full 让 CodeMirror 根元素也占满外层 div；text-sm 统一正文字号
						basicSetup={editorSettings}
					/>
				</div>

				{/* 顶部导航栏：标题（左）+ 操作栏（右），浮在编辑器上方，半透明毛玻璃 */}
				<div
					className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-2 border-border/50 border-b px-4 backdrop-blur-[1.5px]"
					style={{ background: `linear-gradient(to bottom, ${editorBgColor}, ${editorBgColor}1A)` }}
				>
					<span className="max-w-[20%] truncate font-semibold text-base">{title}</span>
					{isSaving && <span className="text-muted-foreground text-xs">保存中...</span>}

					{/* 操作栏：快捷操作（椭圆胶囊）+ 更多操作 + 放大 */}
					<div className="ml-auto flex items-center gap-2">
						{/* 快捷操作工具栏：不透明椭圆背景，内容由 activeToolbarItems 动态渲染；光标在对应格式内时按钮高亮 */}
						{activeToolbarItems.length > 0 && (
							<div
								className="flex items-center gap-0.5 rounded-full p-0.5"
								style={{ backgroundColor: toolbarBgColor }}
							>
								{activeToolbarItems.map((item) => {
									// tool 组：光标在对应格式内时高亮；view 组：设置开启时高亮
									const isActive =
										item.type === "tool"
											? activeFormats.has(item.id)
											: Boolean(editorSettings[item.id as keyof typeof editorSettings]);
									return (
										<Button
											key={item.id}
											variant="ghost"
											size="icon-sm"
											aria-label={item.label}
											className={`rounded-full ${
												isActive
													? "bg-primary/15! text-primary hover:bg-primary/25"
													: "hover:bg-foreground/20!"
											}`}
											onClick={() => handleItemAction(item.type, item.id)}
										>
											<item.icon className="size-4" />
										</Button>
									);
								})}
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
										{group.items.map((item) => (
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

						<Button variant="ghost" size="icon-sm" aria-label="放大">
							<Icons.expand className="size-4" />
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
