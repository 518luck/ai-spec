// # 创建文件夹相关的两个子组件：列表项图标+文字、搜索无结果时的创建按钮

import { useCommandState } from "cmdk";
import type { JSX } from "react";

import { Icons } from "@/shared/ui/icons";
import { FolderIcon } from "./folder-icon";

// > 创建文件夹项的公共内容：图标 + 文字，供 CommandItem 和 CreateButton 复用
export function CreateFolderItemContent({ label }: { label: string }): JSX.Element {
	return (
		<>
			<FolderIcon icon={Icons.folderPlus} />
			<span className="min-w-0 truncate">{label}</span>
		</>
	);
}

// > 搜索无结果时的「创建 xxx」按钮；拆成子组件是因为 useCommandState 必须在 Command 上下文内调用
// > 点击打开 Dialog 并预填搜索词
export function CreateButton({ onSelect }: { onSelect: (name: string) => void }): JSX.Element {
	const search = useCommandState((state) => state.search);

	if (!search.trim()) {
		return <span className="text-muted-foreground">没有匹配的文件夹</span>;
	}

	return (
		<button
			type="button"
			onClick={() => onSelect(search)}
			className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground"
		>
			<CreateFolderItemContent label={`创建 ${search}`} />
		</button>
	);
}
