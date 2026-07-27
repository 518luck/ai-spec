"use client";

// # 全局快捷键 hook:window keydown 监听,内建修饰键精确匹配、焦点排除与 IME 防护
// ! 不用 react-use 的 useKey:它只做 event.key 全等比较,无修饰键组合/焦点排除/启用条件

import { useEffect, useRef } from "react";
import { isMacPlatform } from "@/shared/lib/format-hotkey";

// > combo 写法:"c"、"/"、"mod+\\";mod 在 mac 对应 ⌘、其余平台对应 Ctrl,修饰键精确匹配(⌘C 不会触发 "c")
type UseHotkeyOptions = {
	combo: string;
	onTrigger: (event: KeyboardEvent) => void;
	// false 时不挂监听(如弹窗已开时禁用页面级快捷键)
	enabled?: boolean;
	// 允许裸键在输入场景触发;mod 组合键始终豁免焦点排除
	allowInEditable?: boolean;
	// 命中后阻止浏览器默认行为(如 "/" 防止字符落入刚聚焦的输入框)
	preventDefault?: boolean;
};

type ParsedCombo = {
	key: string;
	mod: boolean;
	shift: boolean;
	alt: boolean;
};

export const useHotkey = ({
	combo,
	onTrigger,
	enabled = true,
	allowInEditable = false,
	preventDefault = true,
}: UseHotkeyOptions): void => {
	// latest-ref:回调变化不重挂监听
	const onTriggerRef = useRef(onTrigger);
	onTriggerRef.current = onTrigger;

	useEffect(() => {
		if (!enabled) return;
		const parsed = parseCombo(combo);

		const handleKeyDown = (event: KeyboardEvent) => {
			// IME 组合期间不响应(229 是组合态下部分浏览器的占位 keyCode)
			if (event.isComposing || event.keyCode === 229) return;
			// 更早的处理者(如 CodeMirror keymap)已消费的事件让行
			if (event.defaultPrevented) return;
			if (!matchesCombo(event, parsed)) return;
			if (!parsed.mod && !allowInEditable && isBareKeySuppressed(event)) return;
			if (preventDefault) event.preventDefault();
			onTriggerRef.current(event);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [combo, enabled, allowInEditable, preventDefault]);
};

// 解析绑定串:最后一段是主键,其余段是修饰键
const parseCombo = (combo: string): ParsedCombo => {
	const parts = combo.toLowerCase().split("+");
	return {
		key: parts.at(-1) ?? "",
		mod: parts.includes("mod"),
		shift: parts.includes("shift"),
		alt: parts.includes("alt"),
	};
};

// 修饰键与主键精确匹配;combo 未声明 shift 时符号键放行 shift(部分键盘布局输入 "/" 等符号本身需按住 shift)
const matchesCombo = (event: KeyboardEvent, parsed: ParsedCombo): boolean => {
	if (event.key.toLowerCase() !== parsed.key) return false;
	const modPressed = isMacPlatform() ? event.metaKey : event.ctrlKey;
	const otherModPressed = isMacPlatform() ? event.ctrlKey : event.metaKey;
	if (modPressed !== parsed.mod || otherModPressed) return false;
	if (event.altKey !== parsed.alt) return false;
	const isLetterKey = /^[a-z]$/.test(parsed.key);
	if (event.shiftKey !== parsed.shift && (parsed.shift || isLetterKey)) return false;
	return true;
};

// > 裸键三重抑制:可编辑元素聚焦、弹出层(菜单/列表框)内、任意模态弹窗打开时,单字母快捷键一律失效
const isBareKeySuppressed = (event: KeyboardEvent): boolean => {
	const target = event.target instanceof Element ? event.target : document.activeElement;
	if (isEditableTarget(target) || isInPopupLayer(target)) return true;
	// 项目所有 Dialog 均带 data-slot=dialog-content(shared/ui/dialog.tsx);kbar 面板自绘不走 Dialog,靠 data-slot=kbar-panel 识别
	return document.querySelector('[data-slot="dialog-content"],[data-slot="kbar-panel"]') !== null;
};

// 可编辑元素:表单控件、contenteditable(覆盖 CodeMirror 的 .cm-content)、textbox 语义容器
const isEditableTarget = (el: Element | null): boolean => {
	if (!el) return false;
	const { tagName } = el;
	if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return true;
	if (el instanceof HTMLElement && el.isContentEditable) return true;
	return el.closest('[role="textbox"]') !== null;
};

// 弹出层:base-ui 菜单/列表框有 typeahead 与自身键盘导航,Popover 弹出内容是 role=dialog,裸键都让行
const isInPopupLayer = (el: Element | null): boolean =>
	el?.closest('[role="menu"],[role="listbox"],[role="dialog"],[role="alertdialog"]') != null;
