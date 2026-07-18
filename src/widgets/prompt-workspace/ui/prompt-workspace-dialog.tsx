"use client";
// # 通用提示词工作台弹窗 —— CodeMirror 编辑器 + 预览，偏好持久化到 localStorage
// > 不含任何业务逻辑（创建/更新/校验），保存行为通过 onSave props 注入

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { syntaxTree } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { Decoration, EditorView, type ViewUpdate } from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { type JSX, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/shared/hooks";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import {
	defaultEditorSettings,
	EDITOR_THEMES,
	executeFormat,
	MENU_GROUPS,
	NODE_NAME_TO_TOOL_ID,
	type ToolId,
} from "../config/editor";
import "../styles/codemirror.css";
import { EditorToolbar } from "./editor-toolbar";
import { MarkdownPreview } from "./markdown-preview";

// 保存时传给外部的数据形状
export type PromptEditorSaveData = {
	name?: string;
	content: string;
	folderId?: string;
};

type PromptWorkspaceDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 保存逻辑由外部注入（草稿传 createDraft，收录传 createRecord）
	onSave: (data: PromptEditorSaveData) => Promise<void>;
	// 保存中状态由外部管理（useSWRMutation 的 isMutating）
	isSaving: boolean;
	// 加载中占位：编辑器区域显示 spinner，避免用不完整内容渲染
	isLoading?: boolean;
	// 文件夹归属的资源类型（"promptDraft" / "promptRecord"）
	resourceType: string;
	// 编辑器占位文案
	placeholder?: string;
	// 内容为空时的标题回退文案
	emptyTitle?: string;
	// 保存中遮罩文案
	savingText?: string;
	// 编辑模式才需要：初始内容和文件夹
	initialContent?: string;
	initialFolderId?: string;
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

// 从内容中提取第一个非空行作为标题；全为空白时返回 undefined（由调用方兜底）
const extractTitle = (content: string): string | undefined => {
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (trimmed) return trimmed;
	}
	return undefined;
};

export function PromptWorkspaceDialog({
	open,
	onOpenChange,
	onSave,
	isSaving,
	isLoading = false,
	resourceType,
	placeholder = "写下你的想法…",
	emptyTitle = "无标题",
	savingText = "保存中...",
	initialContent,
	initialFolderId,
}: PromptWorkspaceDialogProps): JSX.Element {
	const { resolvedTheme } = useTheme();
	const editorRef = useRef<ReactCodeMirrorRef>(null);

	// @ 状态定义

	const isEditMode = initialContent !== undefined; // 是否为编辑模式（传了初始内容就是编辑）
	const [content, setContent] = useState(initialContent ?? "");

	// initialContent 从外部变化时同步编辑器内容（如编辑弹窗加载完成后从空内容切换到全文）
	useEffect(() => {
		setContent(initialContent ?? "");
	}, [initialContent]);

	const [isPreview, setIsPreview] = useState(false); // 是否处于 Markdown 预览模式
	const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set()); // 光标位置正在使用的格式（加粗/斜体等）

	// 文件夹归属：弹窗打开时从 URL ?folderId=xxx 同步（和导航栏筛选同步），用户在弹窗内可自由修改
	const searchParams = useSearchParams();
	const [folderId, setFolderId] = useState<string | undefined>(undefined);
	// 弹窗打开时从 URL 读取最新的 folderId（组件始终挂载，useState 初始值只在首次执行，需手动同步）
	useEffect(() => {
		if (open) setFolderId(searchParams?.get("folderId") ?? initialFolderId);
	}, [open, searchParams, initialFolderId]);

	// > 编辑器偏好：持久化到 localStorage，所有场景共用同一套偏好
	const [activeTools, setActiveTools] = useLocalStorage<string[]>("prompt-workspace.toolbar", [
		"bold",
		"italic",
	]);
	const [editorSettings, setEditorSettings] = useLocalStorage(
		"prompt-workspace.settings",
		defaultEditorSettings,
	);
	const [editorThemeId, setEditorThemeId] = useLocalStorage<string>(
		"prompt-workspace.theme",
		"vscode",
	);
	const [isExpanded, setIsExpanded] = useLocalStorage<boolean>(
		"prompt-workspace.isExpanded",
		false,
	);

	// 切换快捷操作的显示/隐藏（useLocalStorage 自动持久化）
	const toggleTool = (id: string): void => {
		setActiveTools((prev) => {
			const tools = prev ?? [];
			return tools.includes(id) ? tools.filter((t) => t !== id) : [...tools, id];
		});
	};

	// 拖拽排序后更新工具顺序：以可见项的新顺序为准，把当前不可见的项追加到末尾
	const reorderTools = (newOrder: string[]): void => {
		setActiveTools((prev) => {
			const reordered = (prev ?? []).slice().sort((a, b) => {
				const ia = newOrder.indexOf(a);
				const ib = newOrder.indexOf(b);
				// 不在 newOrder 里的（不可见项）排到最后，保持原相对顺序
				if (ia === -1 && ib === -1) return 0;
				if (ia === -1) return 1;
				if (ib === -1) return -1;
				return ia - ib;
			});
			return reordered;
		});
	};

	// 更新视图设置（useLocalStorage 自动持久化）
	const updateEditorSettings = (settings: typeof defaultEditorSettings): void => {
		setEditorSettings(settings);
	};

	// 切换编辑器主题（useLocalStorage 自动持久化）
	const handleThemeChange = (id: string): void => {
		setEditorThemeId(id);
	};

	// 切换放大/缩小（useLocalStorage 自动持久化）
	const toggleExpanded = (): void => {
		setIsExpanded((prev) => !prev);
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

	// 胶囊中显示的操作项：按 activeTools 的顺序排列（支持拖拽排序），再按 showIn 过滤
	const allItems = MENU_GROUPS.flatMap((group) =>
		group.items.map((item) => ({ ...item, type: group.type })),
	);
	const activeToolbarItems = activeTools
		.map((id) => allItems.find((item) => item.id === id))
		.filter(
			(item): item is { type: string } & typeof item => item !== undefined && isVisible(item),
		);

	// 点击胶囊按钮或菜单文字
	const handleItemAction = (type: "tool" | "display" | "preview", id: string): void => {
		if (type === "tool") {
			executeFormat(editorRef.current, id as ToolId);
		} else if (type === "display") {
			updateEditorSettings({
				...editorSettings,
				[id]: !editorSettings[id as keyof typeof editorSettings],
			});
		} else if (type === "preview") {
			setIsPreview((v) => !v);
		}
	};

	// 从内容第一个非空行提取标题，全空白时回退到 emptyTitle
	const title = extractTitle(content) ?? emptyTitle;

	// 关闭弹窗：有内容则保存后关闭，空内容直接关闭
	// > 编辑模式保存后不清空内容（关闭弹窗即可），创建模式保存后清空以便下次使用
	const handleClose = async (): Promise<void> => {
		const trimmed = content.trim();

		if (trimmed) {
			try {
				await onSave({
					name: extractTitle(content) ?? emptyTitle,
					content,
					folderId,
				});
			} catch {
				return; // 错误处理由 onSave 内部完成（toast 等），这里只阻止关闭
			}
		}

		// 创建模式清空状态以便下次使用，编辑模式保留内容
		if (!isEditMode) {
			setContent("");
			setIsPreview(false);
			setFolderId(undefined);
		}
		onOpenChange(false);
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
					{isLoading ? (
						<div className="flex h-full items-center justify-center text-muted-foreground">
							<ScaleLoaderWrap />
						</div>
					) : isPreview ? (
						<MarkdownPreview content={content} height={isExpanded ? "37rem" : "29rem"} />
					) : (
						<CodeMirror
							ref={editorRef}
							value={content}
							onChange={setContent}
							onUpdate={handleUpdate}
							extensions={extensions}
							theme={editorTheme}
							placeholder={placeholder}
							height="100%"
							className="h-full text-sm"
							basicSetup={editorSettings}
						/>
					)}
				</div>

				{/* 顶部导航栏 */}
				<EditorToolbar
					title={title}
					editorState={{
						editorBgColor,
						toolbarBgColor,
						editorSettings,
						editorThemeId,
						activeFormats,
						isPreview,
						isExpanded,
						onThemeChange: handleThemeChange,
						onExpandToggle: toggleExpanded,
					}}
					quickToolbar={{
						items: activeToolbarItems,
						onAction: handleItemAction,
						onToggle: toggleTool,
						onReorder: reorderTools,
					}}
					folder={{
						resourceType,
						value: folderId,
						onChange: setFolderId,
					}}
				/>

				{/* 保存中遮罩 */}
				{isSaving && (
					<div className="absolute inset-0 z-50 flex items-center justify-center gap-2 bg-popover/80 text-muted-foreground backdrop-blur-sm">
						<ScaleLoaderWrap height={16} width={2} margin={1} radius={1} />
						<span className="text-sm">{savingText}</span>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
