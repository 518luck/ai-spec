"use client";
// # 草稿创建弹窗 —— CodeMirror 编辑器 + 预览，偏好持久化到 cookie

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { syntaxTree } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { Decoration, EditorView, type ViewUpdate } from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { type JSX, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createDraft } from "@/entities/prompt";
import { getCookie, setCookie } from "@/shared/lib/cookie/client-cookie";
import {
	COOKIE_DEFAULTS,
	EDITOR_PREFERENCES_COOKIE,
	type EditorPreferencesCookie,
} from "@/shared/lib/cookie/cookies";
import { createDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Spinner } from "@/shared/ui/spinner";
import {
	defaultEditorSettings,
	EDITOR_THEMES,
	executeFormat,
	MENU_GROUPS,
	NODE_NAME_TO_TOOL_ID,
	type ToolId,
} from "../../config/editor-dialog";
import "../../styles/codemirror.css";
import { DraftPreview } from "./draft-preview";
import { EditorToolbar } from "./editor-toolbar";

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

	let current: typeof node | null = node;
	while (current) {
		const toolId = NODE_NAME_TO_TOOL_ID[current.name];
		if (toolId) active.add(toolId);
		current = current.parent;
	}

	return active;
};

export function CreateDraftDialog({ open, onOpenChange }: CreateDraftDialogProps): JSX.Element {
	const router = useRouter();
	const { resolvedTheme } = useTheme();
	const editorRef = useRef<ReactCodeMirrorRef>(null);

	// @ 状态定义

	const [content, setContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isPreview, setIsPreview] = useState(false);

	// 编辑器偏好默认值
	const defaultToolbar = ["bold", "italic"];
	const defaultThemeId = "vscode";

	// > 偏好状态：持久化到单个 cookie（ai-spec.editor-preferences），刷新后恢复
	const [activeTools, setActiveTools] = useState<string[]>(defaultToolbar);
	const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
	const [editorSettings, setEditorSettings] = useState(defaultEditorSettings);
	const [editorThemeId, setEditorThemeId] = useState(defaultThemeId);
	const [isExpanded, setIsExpanded] = useState(false);

	// @ 副作用：挂载后从 cookie 读取全部偏好

	useEffect(() => {
		const raw = getCookie(EDITOR_PREFERENCES_COOKIE);
		if (!raw) return;
		try {
			const prefs = JSON.parse(raw) as EditorPreferencesCookie;
			if (Array.isArray(prefs.toolbar)) setActiveTools(prefs.toolbar);
			if (prefs.settings) setEditorSettings({ ...defaultEditorSettings, ...prefs.settings });
			if (prefs.theme) setEditorThemeId(prefs.theme);
		} catch {
			// cookie 解析失败时用默认值
		}
	}, []);

	// @ 偏好持久化方法

	// 把当前全部偏好写入 cookie
	const savePreferences = (overrides: EditorPreferencesCookie): void => {
		setCookie(
			EDITOR_PREFERENCES_COOKIE,
			JSON.stringify({
				toolbar: overrides.toolbar ?? activeTools,
				settings: overrides.settings ?? editorSettings,
				theme: overrides.theme ?? editorThemeId,
			}),
			COOKIE_DEFAULTS,
		);
	};

	// 切换快捷操作的显示/隐藏，同时持久化
	const toggleTool = (id: string): void => {
		setActiveTools((prev) => {
			const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
			savePreferences({ toolbar: next });
			return next;
		});
	};

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

	// @ 派生状态：主题变体及背景色

	const currentTheme = EDITOR_THEMES.find((t) => t.id === editorThemeId) ?? EDITOR_THEMES[0];
	const isDark = resolvedTheme === "dark";
	const editorTheme = isDark ? currentTheme.dark : currentTheme.light;
	const editorBgColor = isDark ? currentTheme.darkBg : currentTheme.lightBg;
	const toolbarBgColor = isDark ? currentTheme.darkToolbarBg : currentTheme.lightToolbarBg;

	// @ Markdown 扩展配置

	// Markdown 语法扩展 + 首行标题装饰，用 useMemo 缓存避免每次渲染重建
	const extensions = useMemo(
		() => [
			markdown({ base: markdownLanguage, codeLanguages: languages }),
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

	// @ 派生状态：可见菜单项

	// 当前模式下可见的菜单项
	const currentMode = isPreview ? "preview" : "edit";
	const isVisible = (item: { showIn?: string }): boolean =>
		!item.showIn || item.showIn === "both" || item.showIn === currentMode;

	// 胶囊中显示的操作项（根据 showIn 过滤）
	const activeToolbarItems = MENU_GROUPS.flatMap((group) =>
		group.items
			.filter((item) => activeTools.includes(item.id) && isVisible(item))
			.map((item) => ({ ...item, type: group.type })),
	);

	// 点击胶囊按钮或菜单文字
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

	// 从内容首行提取标题
	const title = content.split("\n")[0]?.trim() || "无标题草稿";

	// 关闭弹窗：有内容则保存后关闭，空内容直接关闭
	// ! handleClose 在内容非空时才调用 createDraft，空内容直接关闭不触发保存
	const handleClose = async (): Promise<void> => {
		const trimmed = content.trim();

		if (!trimmed) {
			setContent("");
			onOpenChange(false);
			return;
		}

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
						style={{ maxHeight: "85vh", maxWidth: "calc(100% - 2rem)" }}
						initial={false}
						animate={{
							width: isExpanded ? "73rem" : "32rem",
							height: isExpanded ? "40rem" : "32rem",
						}}
					/>
				}
			>
				{/* 编辑器/预览区域 */}
				<div className="min-h-0 flex-1 overflow-hidden">
					{isPreview ? (
						<DraftPreview content={content} height={isExpanded ? "37rem" : "29rem"} />
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

				{/* 顶部导航栏 */}
				<EditorToolbar
					title={title}
					editorBgColor={editorBgColor}
					toolbarBgColor={toolbarBgColor}
					activeToolbarItems={activeToolbarItems}
					activeFormats={activeFormats}
					editorSettings={editorSettings}
					editorThemeId={editorThemeId}
					isPreview={isPreview}
					isExpanded={isExpanded}
					onItemAction={handleItemAction}
					onCheckboxToggle={toggleTool}
					onThemeChange={handleThemeChange}
					onExpandToggle={() => setIsExpanded((v) => !v)}
				/>

				{/* 保存中遮罩 */}
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
