import { type Change, diffLines } from "diff";

// # Diff 工具函数：基于行数的增量 diff 计算、应用与重建（服务端专用，版本存储与重建使用）

// @ Diff 操作：keep/delete 只记行数（不携带内容），insert 才带新增文本
export type DiffOp =
	| { type: "keep"; count: number } // 从源文本保留 count 行
	| { type: "delete"; count: number } // 从源文本跳过 count 行
	| { type: "insert"; lines: string[] }; // 插入这些新行

// > 计算两个文本的行级 diff：改动段记行数/文本，未改段只记 count
export const calculateDiff = ({
	oldText,
	newText,
}: {
	oldText: string;
	newText: string;
}): DiffOp[] => {
	// Change 类型定义
	// interface Change {
	// 	value: string; // 文本内容
	// 	added?: boolean; // 是否新增
	// 	removed?: boolean; // 是否删除
	// 	count?: number; // token 数量
	// }
	const changes: Change[] = diffLines(oldText, newText);

	const ops: DiffOp[] = changes.map((change) => {
		const lines = change.value.split("\n");
		// 只移除末尾的空字符串（split 产生的），保留中间的空行
		if (lines.length > 0 && lines[lines.length - 1] === "") {
			lines.pop();
		}

		if (change.removed) {
			return { type: "delete", count: lines.length };
		}
		if (change.added) {
			return { type: "insert", lines };
		}
		return { type: "keep", count: lines.length };
	});

	return ops;
};

// > 对照旧的内容，按照ops的操作指示进行重写
export const applyDiff = ({ source, ops }: { source: string; ops: DiffOp[] }): string => {
	const sourceLines = source.split("\n");
	let cursor = 0;
	// > 应用 diff 到源文本：按 keep/delete 消耗源行游标，insert 追加新行
	const newLines: string[] = [];

	for (const op of ops) {
		// keep → 抄 N 行 + 手指往后挪 N 行
		// delete → 不抄 + 手指往后挪 N 行
		// insert → 手指不动
		switch (op.type) {
			case "keep":
				newLines.push(...sourceLines.slice(cursor, cursor + op.count));
				cursor += op.count;
				break;
			case "delete":
				// 仅推进游标，不复制任何行
				cursor += op.count;
				break;
			case "insert":
				newLines.push(...op.lines);
				break;
		}
	}

	return newLines.join("\n");
};

// > 从快照和 diff 序列重建完整内容：逐版本链式叠加
export const reconstructContent = ({
	snapshot,
	diffs,
}: {
	snapshot: string;
	diffs: DiffOp[][];
}): string => {
	let content = snapshot;

	for (const ops of diffs) {
		content = applyDiff({ source: content, ops });
	}

	return content;
};

// > 将 diff 对象序列化为 JSON 字符串
export const serializeDiff = (ops: DiffOp[]): string => {
	return JSON.stringify(ops);
};

// > 将 JSON 字符串反序列化为 diff 对象
export const deserializeDiff = (json: string): DiffOp[] => {
	return JSON.parse(json) as DiffOp[];
};
