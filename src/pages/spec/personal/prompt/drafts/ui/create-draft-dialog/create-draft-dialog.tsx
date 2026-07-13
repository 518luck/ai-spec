"use client";
// # 草稿创建弹窗 —— CodeMirror 编辑器 + 预览，偏好持久化到 localStorage

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
import { createFolder, getFolders } from "@/entities/folder";
import { createDraft } from "@/entities/prompt";
import { useLocalStorage } from "@/shared/hooks";
import { folderNameSchema } from "@/shared/lib/zod/schemas/folder";
import { createDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Spinner } from "@/shared/ui/spinner";
import type { FolderOption } from "@/widgets/folder-combobox";
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
	const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

	// 文件夹归属：folderId 为 undefined 表示不加入任何文件夹
	const [folderId, setFolderId] = useState<string | undefined>(undefined);
	const [folders, setFolders] = useState<FolderOption[]>([]);

	// > 编辑器偏好：持久化到 localStorage，刷新后自动恢复
	// > react-use 的 useLocalStorage 返回 T | undefined（用户清空 localStorage 时），解构默认值兜底防白屏
	const [activeTools = ["bold", "italic"], setActiveTools] =
		useLocalStorage<string[]>("draft.toolbar");
	const [editorSettings = defaultEditorSettings, setEditorSettings] =
		useLocalStorage<typeof defaultEditorSettings>("draft.settings");
	const [editorThemeId = "vscode", setEditorThemeId] = useLocalStorage<string>("draft.theme");
	const [isExpanded = false, setIsExpanded] = useLocalStorage<boolean>("draft.isExpanded");

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

	// 对话框打开时拉取草稿文件夹列表，关闭时重置归属选择
	useEffect(() => {
		if (!open) return;
		void getFolders("promptDraft")
			.then(setFolders)
			.catch(() => {
				// 拉取失败静默处理，文件夹选择仍可用（只是列表为空）
			});
	}, [open]);

	// 行内新建草稿文件夹：名称先用同一份 schema 预校验，成功后追加到列表并自动选中
	const handleCreateFolder = async ({
		name,
		description,
		color,
	}: {
		name: string;
		description?: string;
		color?: string;
	}): Promise<FolderOption | null> => {
		const parsed = folderNameSchema.safeParse(name);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入文件夹名称");
			return null;
		}
		try {
			const created = await createFolder({
				name: parsed.data,
				description,
				color,
				resourceType: "promptDraft",
			});
			setFolders((prev) => [...prev, created]);
			return created;
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建文件夹失败");
			return null;
		}
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

	// 从内容首行提取标题
	const title = content.split("\n")[0]?.trim() || "无标题草稿";

	// 关闭弹窗：有内容则保存后关闭，空内容直接关闭
	// ! handleClose 在内容非空时才调用 createDraft，空内容直接关闭不触发保存
	const handleClose = async (): Promise<void> => {
		const trimmed = content.trim();

		if (!trimmed) {
			setContent("");
			setIsPreview(false);
			setFolderId(undefined);
			onOpenChange(false);
			return;
		}

		const parsed = createDraftDtoSchema.safeParse({
			name: content.split("\n")[0]?.trim() || undefined,
			content,
			folder_id: folderId,
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
			setIsPreview(false);
			setFolderId(undefined);
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
						options: folders,
						value: folderId,
						onChange: setFolderId,
						onCreate: handleCreateFolder,
					}}
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
