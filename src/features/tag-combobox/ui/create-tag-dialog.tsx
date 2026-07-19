"use client";

// # 新建标签对话框：输入名称 + 选颜色，提交创建（比文件夹精简，无描述字段）

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
import { Icons } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { TAG_DEFAULT_COLOR, TAG_PRESET_COLORS } from "../config/tag-colors";

type CreateTagDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 打开时预填的名称（如来自搜索词），不传则为空
	initialName?: string;
	// 提交创建：传入标签名称、颜色，由父组件校验后落库并选中
	onSubmit: (input: { name: string; color: string }) => Promise<void>;
};

// # 新建标签对话框：输入名称、选颜色，提交创建
export function CreateTagDialog({
	open,
	onOpenChange,
	initialName = "",
	onSubmit,
}: CreateTagDialogProps): JSX.Element {
	const [name, setName] = useState(initialName);
	const [color, setColor] = useState<string>(TAG_DEFAULT_COLOR);

	// open 打开时同步预填名称，重置颜色
	useEffect(() => {
		if (open) {
			setName(initialName);
			setColor(TAG_DEFAULT_COLOR);
		}
	}, [open, initialName]);

	// 提交：把原始值传给调用方，由调用方用 createTagDtoSchema 全量校验
	const handleSubmit = async (): Promise<void> => {
		await onSubmit({
			name: name.trim(),
			color,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-lg">
				<DialogHeader className="relative">
					<DialogTitle>新建标签</DialogTitle>
					<DialogDescription>给内容打上标签，方便日后检索归类。</DialogDescription>
					{/* // 右上角预览：当前选中颜色的圆点（标签的视觉符号） */}
					<span
						className="absolute top-6 right-6 size-8 rounded-full ring-2 ring-background"
						style={{ backgroundColor: color }}
						aria-hidden
					/>
				</DialogHeader>

				<DialogContentBody className="flex gap-4">
					{/* // 右侧：名称输入 + 预设色 */}
					<div className="flex min-w-0 flex-1 flex-col gap-3">
						<div className="flex flex-col gap-2">
							<Label>标签名称</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSubmit();
								}}
								placeholder="输入标签名称"
								autoFocus
							/>
						</div>
						<div className="grid grid-cols-6 gap-2">
							{TAG_PRESET_COLORS.map((preset) => (
								<Button
									key={preset}
									variant="ghost"
									size="icon-sm"
									onClick={() => setColor(preset)}
									aria-label={`选择颜色 ${preset}`}
									className={cn(
										"hover:scale-110",
										color === preset && "ring-2 ring-ring ring-offset-1 ring-offset-background",
									)}
									style={{ color: preset }}
								>
									<Icons.squares className="size-6" />
								</Button>
							))}
						</div>
					</div>
					{/* // 左侧：自定义颜色选择器 */}
					<div className="flex w-52 shrink-0 flex-col items-center justify-end gap-3 pb-1">
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
