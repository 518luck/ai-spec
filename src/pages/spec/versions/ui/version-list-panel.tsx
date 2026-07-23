// # 版本列表面板：右侧时间列表，显示版本历史供选择（由父级 sticky 钉住常驻）

import dayjs from "dayjs";
import type { JSX } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import type { VersionListItem } from "./version-page";

// > 格式化时间为「MM-DD HH:mm」
const formatTime = (dateString: string): string => dayjs(dateString).format("MM-DD HH:mm");

// @ 版本列表面板的 Props
interface VersionListPanelProps {
	versions: VersionListItem[] | undefined;
	isLoading: boolean;
	selectedId: string | null;
	onSelect: (id: string) => void;
}

export function VersionListPanel({
	versions,
	isLoading,
	selectedId,
	onSelect,
}: VersionListPanelProps): JSX.Element {
	// > 渲染版本列表内容
	const renderContent = () => {
		// 加载中：渲染 5 条骨架屏占位，避免内容区空白
		if (isLoading) {
			return Array.from({ length: 5 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: 静态骨架屏列表
				<Skeleton key={i} className="h-9 w-full" />
			));
		}
		// 数据为空：展示「暂无版本」提示
		if (!versions || versions.length === 0) {
			return <p className="px-2 py-4 text-center text-muted-foreground text-xs">暂无版本</p>;
		}
		// 有数据：把每个版本渲染为可点击的时间按钮，选中项高亮
		return versions.map((version) => (
			<button
				key={version.id}
				type="button"
				onClick={() => onSelect(version.id)}
				className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
					selectedId === version.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
				}`}
			>
				{formatTime(version.createdAt)}
			</button>
		));
	};

	return (
		<div className="flex h-screen w-52 shrink-0 flex-col overflow-hidden border-l shadow-lg">
			{/* // @ 标题：固定在顶部不随列表滚动 */}
			<div className="flex items-center px-3 py-2 text-muted-foreground text-xs">全部版本</div>
			<div className="flex-1 overflow-y-auto p-2">
				<div className="space-y-1">{renderContent()}</div>
			</div>
		</div>
	);
}
