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
import { Textarea } from "@/shared/ui/textarea";
import { FOLDER_DEFAULT_COLOR, FOLDER_PRESET_COLORS } from "../config/folder-colors";
import { FolderIcon } from "./folder-icon";

type CreateFolderDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 打开时预填的名称（如来自搜索词），不传则为空
	initialName?: string;
	// 提交创建：传入文件夹名称、描述、颜色，由父组件调 onCreate 落库并选中
	onSubmit: (input: { name: string; description?: string; color: string }) => Promise<void>;
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
	const [color, setColor] = useState<string>(FOLDER_DEFAULT_COLOR);

	// open 打开时同步预填名称，重置描述/颜色
	useEffect(() => {
		if (open) {
			setName(initialName);
			setDescription("");
			setColor(FOLDER_DEFAULT_COLOR);
		}
	}, [open, initialName]);

	// 提交：把原始值传给调用方，由调用方用 createFolderDtoSchema 全量校验（含 resourceType）
	const handleSubmit = async (): Promise<void> => {
		await onSubmit({
			name: name.trim(),
			description: description.trim() || undefined,
			color,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-lg">
				<DialogHeader className="relative">
					<DialogTitle>新建文件夹</DialogTitle>
					<DialogDescription>创建一个属于你的文件夹吧，取个好记的名字和颜色。</DialogDescription>
					<FolderIcon
						color={color}
						className="absolute top-4 right-4 size-12 rounded-lg"
						iconClassName="size-6"
					/>
				</DialogHeader>

				<DialogContentBody className="flex gap-4">
					{/* // 右侧：名称 + 描述输入 */}
					<div className="flex min-w-0 flex-1 flex-col gap-3">
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
								className="max-h-32"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="补充说明文件夹用途"
								rows={3}
							/>
						</div>
						<div className="grid grid-cols-5 gap-2">
							{FOLDER_PRESET_COLORS.map((preset) => (
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
					{/* // 左侧：颜色选择器 */}
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
