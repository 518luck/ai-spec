"use client";

// # Markdown 编辑器：CodeMirror 编辑 + MarkdownPreview 预览，靠 isPreview 切换
// > 编辑器偏好/预览/光标格式从 useEditorStore 订阅；ref 用 forwardRef 暴露给编排层（与 QuickToolbar 共享）
// > 无需 Provider 包裹，store 独立于组件树

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { Decoration, EditorView, type ViewUpdate } from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { type JSX, useEffect, useMemo, useRef } from "react";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { resolveEditorColors } from "../lib/editor-colors";
import { resolveActiveFormats } from "../lib/resolve-active-formats";
import { useEditorStore } from "../model/editor-store";
import "../styles/codemirror.css";
import { MarkdownPreview } from "./markdown-preview";

type MarkdownEditorProps = {
	// 受控正文
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	// 加载中：编辑区显示 spinner
	isLoading?: boolean;
	// 透传给 MarkdownPreview 的 className（padding/margin 等布局由调用方决定）
	previewClassName?: string;
};

// > Markdown 编辑器：ref/theme/设置/预览 从 store 取；ref 转发给编排层
export function MarkdownEditor({
	ref,
	value,
	onChange,
	placeholder,
	isLoading = false,
	previewClassName,
}: MarkdownEditorProps & { ref?: React.Ref<ReactCodeMirrorRef> }): JSX.Element {
	const { resolvedTheme } = useTheme();
	// 内部 ref：handleUpdate 读 .current 算光标格式；外部 ref：同步给编排层供 QuickToolbar 执行格式化
	const internalRef = useRef<ReactCodeMirrorRef>(null);
	// 同步内部 ref 到外部 ref（让编排层持有的 ref 也指向同一 CodeMirror 实例）
	useEffect(() => {
		if (typeof ref === "function") ref(internalRef.current);
		else if (ref)
			(ref as React.MutableRefObject<ReactCodeMirrorRef | null>).current = internalRef.current;
	});

	// 订阅需要的字段（selector 细粒度订阅，互不影响）
	const editorSettings = useEditorStore((s) => s.editorSettings);
	const editorThemeId = useEditorStore((s) => s.editorThemeId);
	const isPreview = useEditorStore((s) => s.isPreview);
	const setActiveFormats = useEditorStore((s) => s.setActiveFormats);

	// 派生：主题 id + 系统明暗 → CodeMirror 主题对象
	const { editorTheme } = resolveEditorColors(editorThemeId, resolvedTheme === "dark");

	// Markdown 语法扩展 + 首行标题装饰，缓存避免每次渲染重建
	const extensions = useMemo(
		() => [
			markdown({ base: markdownLanguage, codeLanguages: languages }),
			EditorView.decorations.of(() =>
				Decoration.set([Decoration.line({ class: "first-line-title" }).range(0)]),
			),
		],
		[],
	);

	// CodeMirror 光标/文档变化：重算光标处活跃格式，写回 store 供 QuickToolbar 高亮
	const handleUpdate = (viewUpdate: ViewUpdate): void => {
		if (viewUpdate.docChanged || viewUpdate.selectionSet) {
			setActiveFormats(resolveActiveFormats(internalRef.current));
		}
	};

	// 加载中：编辑区整体显示 spinner
	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				<ScaleLoaderWrap />
			</div>
		);
	}

	// 预览模式：Markdown 渲染；否则：CodeMirror 编辑
	if (isPreview) {
		return <MarkdownPreview content={value} className={previewClassName} />;
	}

	return (
		<CodeMirror
			ref={internalRef}
			value={value}
			onChange={onChange}
			onUpdate={handleUpdate}
			extensions={extensions}
			theme={editorTheme}
			placeholder={placeholder}
			height="100%"
			className="h-full text-sm"
			basicSetup={editorSettings}
		/>
	);
}
