"use client";

// # Markdown 编辑器：CodeMirror 编辑 + Preview 预览，靠 isPreview 切换
// > 编辑器偏好/预览/光标格式从 useStore 订阅；ref 用 forwardRef 暴露给编排层（与 QuickToolbar 共享）
// > 无需 Provider 包裹，store 独立于组件树

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { Decoration, EditorView, keymap, type ViewUpdate } from "@codemirror/view";
import CodeMirror, { Prec, type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { type JSX, useEffect, useMemo, useRef } from "react";
import { cn } from "@/shared/lib/utils";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { formatKeymap } from "../config/editor";
import { resolveColors } from "../lib/colors";
import { resolveActiveFormats } from "../lib/resolve-active-formats";
import { useStore } from "../model/store";
import "../styles/codemirror.css";
import { Preview } from "./preview";

type EditorProps = {
	// 受控正文
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	// 加载中：编辑区显示 spinner
	isLoading?: boolean;
	// 透传给 CodeMirror 根节点的 className（编辑区 padding 等布局由调用方决定，覆盖内置样式需加 `!`）
	editorClassName?: string;
	// 透传给 Preview 的 className（padding/margin 等布局由调用方决定）
	previewClassName?: string;
	// ⌘↵/⌘S 提交回调（如工作台弹窗的保存并关闭）；不传时按键放行给编辑器默认行为
	onSubmitShortcut?: () => void;
};

// > Markdown 编辑器：ref/theme/设置/预览 从 store 取；ref 转发给编排层
export function Editor({
	ref,
	value,
	onChange,
	placeholder,
	isLoading = false,
	editorClassName,
	previewClassName,
	onSubmitShortcut,
}: EditorProps & { ref?: React.Ref<ReactCodeMirrorRef> }): JSX.Element {
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
	const editorSettings = useStore((s) => s.editorSettings);
	const editorThemeId = useStore((s) => s.editorThemeId);
	const isPreview = useStore((s) => s.isPreview);
	const setActiveFormats = useStore((s) => s.setActiveFormats);

	// 派生：主题 id + 系统明暗 → CodeMirror 主题对象
	const { editorTheme } = resolveColors(editorThemeId, resolvedTheme === "dark");

	// onSubmitShortcut 经 latest-ref 中转：keymap 闭包读 ref.current，回调变化不重建 extensions
	const onSubmitShortcutRef = useRef(onSubmitShortcut);
	onSubmitShortcutRef.current = onSubmitShortcut;

	// Markdown 语法扩展 + 首行标题装饰 + 格式化/提交快捷键，缓存避免每次渲染重建
	const extensions = useMemo(() => {
		// 提交快捷键：读 ref 取最新回调；未传回调时 return false 放行默认行为
		const runSubmit = (): boolean => {
			const onSubmit = onSubmitShortcutRef.current;
			if (!onSubmit) return false;
			onSubmit();
			return true;
		};
		return [
			markdown({ base: markdownLanguage, codeLanguages: languages }),
			EditorView.decorations.of(() =>
				Decoration.set([Decoration.line({ class: "first-line-title" }).range(0)]),
			),
			formatKeymap,
			// ! 必须 Prec.highest：basicSetup 的 defaultKeymap 已把 Mod-Enter 占为 insertBlankLine
			Prec.highest(
				keymap.of([
					{ key: "Mod-Enter", run: runSubmit },
					{ key: "Mod-s", run: runSubmit },
				]),
			),
		];
	}, []);

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
		// > 预览用 ScrollArea 接管滚动（与 CodeMirror 自带 cm-scroller 滚动样式对齐）；编辑模式不能用 ScrollArea，CodeMirror height:100% 与 ScrollArea viewport 收缩特性冲突会让虚拟滚动失效
		return (
			<ScrollArea className="h-full max-h-full">
				<Preview content={value} className={previewClassName} />
			</ScrollArea>
		);
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
			className={cn("h-full text-sm", editorClassName)}
			basicSetup={editorSettings}
		/>
	);
}
