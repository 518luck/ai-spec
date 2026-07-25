// # 从语法树解析光标位置处于哪些格式内，返回活跃的工具 id 集合

import { syntaxTree } from "@codemirror/language";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { NODE_NAME_TO_TOOL_ID } from "../config/editor";

export const resolveActiveFormats = (view: ReactCodeMirrorRef | null): Set<string> => {
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
