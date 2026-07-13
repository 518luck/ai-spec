import type { JSX } from "react";
import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogContentBody,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { FolderIcon } from "./folder-icon";

// 预定义颜色盘：覆盖常见分类色相，含中性灰；均为 #RRGGBB 格式（对齐 folderColorSchema）
const PRESET_COLORS = [
	"#ef4444", // 红
	"#f59e0b", // 橙
	"#10b981", // 绿
	"#06b6d4", // 青
	"#3b82f6", // 蓝
	"#8b5cf6", // 紫
	"#ec4899", // 粉
	"#64748b", // 灰
] as const;

// 默认颜色：蓝色，首次打开时选中
const DEFAULT_COLOR = PRESET_COLORS[4];

type CreateFolderDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 打开时预填的名称（如来自搜索词），不传则为空
	initialName?: string;
	// 提交创建：传入文件夹名称、描述、颜色，由父组件调 onCreate 落库并选中
	onSubmit: (input: { name: string; description?: string; color?: string }) => Promise<void>;
};

// # 新建文件夹对话框：输入名称、描述、选颜色，提交创建
export function CreateFolderDialog({
	open,
	onOpenChange,
	initialName = "",
	onSubmit,
}: CreateFolderDialogProps): JSX.Element {
	const [name, setName] = useState(initialName);
	const [description, setDescription] = useState("");
	const [color, setColor] = useState<string>(DEFAULT_COLOR);

	// open 打开时同步预填名称，重置描述/颜色
	useEffect(() => {
		if (open) {
			setName(initialName);
			setDescription("");
			setColor(DEFAULT_COLOR);
		}
	}, [open, initialName]);

	// 校验名称非空后提交，成功清空
	const handleSubmit = async (): Promise<void> => {
		const trimmed = name.trim();
		if (!trimmed) return;
		await onSubmit({
			name: trimmed,
			description: description.trim() || undefined,
			color,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>新建文件夹</DialogTitle>
					<DialogDescription>输入文件夹名称、描述和颜色，创建后会自动选中。</DialogDescription>
				</DialogHeader>

				<DialogContentBody className="flex gap-4">
					{/* // 右侧：名称 + 描述输入 */}
					<div className="flex flex-1 flex-col gap-3">
						<div className="flex flex-col gap-2">
							<Label>文件夹名称</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSubmit();
								}}
								placeholder="输入文件夹名称"
								autoFocus
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>描述（可选）</Label>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="补充说明文件夹用途"
								rows={3}
							/>
						</div>
						<div className="grid grid-cols-4 gap-2">
							{PRESET_COLORS.map((preset) => (
								<button
									key={preset}
									type="button"
									onClick={() => setColor(preset)}
									aria-label={`选择颜色 ${preset}`}
									className={cn(
										"size-5 cursor-pointer rounded-full transition-transform hover:scale-110",
										color === preset ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : "",
									)}
									style={{ backgroundColor: preset }}
								/>
							))}
						</div>
					</div>
					{/* // 左侧：图标预览 + 颜色选择器 */}
					<div className="flex w-52 shrink-0 flex-col items-center gap-3">
						<FolderIcon color={color} className="size-12 rounded-lg" />

						<HexColorPicker color={color} onChange={setColor} className="w-full" />
					</div>
				</DialogContentBody>

				<DialogFooter>
					<Button className="w-full" onClick={handleSubmit}>
						创建
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
