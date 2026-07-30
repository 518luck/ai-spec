"use client";

// # 新建领域空间对话框：取个名字 + 挑一个图标，提交交给调用方落库

import { AnimatePresence, motion } from "motion/react";
import { type JSX, useEffect, useState } from "react";
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
import {
	DEFAULT_SPACE_ICON_KEY,
	ICON_CATEGORIES,
	RULE_SPACE_ICON_OPTIONS,
	resolveSpaceIcon,
	SPACE_DEFAULT_COLOR,
	SPACE_PRESET_COLORS,
} from "../config/space-icons";

type CreateSpaceDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 打开时预填的名称（如来自搜索词），不传则为空
	initialName?: string;
	// 提交创建：传入空间名称、图标 key、颜色，由调用方全量校验后落库
	onSubmit: (input: { name: string; icon: string; color: string }) => Promise<void>;
};

export function CreateSpaceDialog({
	open,
	onOpenChange,
	initialName = "",
	onSubmit,
}: CreateSpaceDialogProps): JSX.Element {
	const [name, setName] = useState(initialName);
	const [icon, setIcon] = useState<string>(DEFAULT_SPACE_ICON_KEY);
	const [color, setColor] = useState<string>(SPACE_DEFAULT_COLOR);

	// 打开时同步预填名称、重置图标与颜色
	useEffect(() => {
		if (open) {
			setName(initialName);
			setIcon(DEFAULT_SPACE_ICON_KEY);
			setColor(SPACE_DEFAULT_COLOR);
		}
	}, [open, initialName]);

	const handleSubmit = async (): Promise<void> => {
		await onSubmit({ name: name.trim(), icon, color });
	};

	const PreviewIcon = resolveSpaceIcon(icon);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-lg">
				<DialogHeader className="relative">
					<DialogTitle>新建领域空间</DialogTitle>
					<DialogDescription className="pr-16">
						领域空间之间彼此隔离，标签无法贯穿。
					</DialogDescription>
					{/* // 预览：color 驱动的淡彩底 + 同色图标（切换时淡入淡出） */}
					<div
						className="absolute top-4 right-4 flex size-12 items-center justify-center rounded-lg"
						style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
					>
						<AnimatePresence initial={false} mode="wait">
							<motion.div
								key={icon}
								initial={{ opacity: 0, scale: 0.6 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.6 }}
								transition={{ duration: 0.15 }}
								className="flex items-center justify-center"
							>
								<PreviewIcon className="size-6" style={{ color }} />
							</motion.div>
						</AnimatePresence>
					</div>
				</DialogHeader>

				<DialogContentBody className="flex items-stretch gap-4">
					{/* // 左侧：空间名称 + 自定义取色器（底部对齐右侧颜色区） */}
					<div className="flex min-w-0 flex-1 flex-col gap-2">
						<Label>空间名称</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSubmit();
							}}
							placeholder="如：代码、创作、智能体"
							autoFocus
						/>
						{/* // flex-1 占位吸收两侧高度差，把取色器推到底部与右侧颜色网格对齐 */}
						<div className="flex-1" />
						<HexColorPicker color={color} onChange={setColor} className="w-full" />
					</div>
					{/* // 右侧：标识 + 颜色选择 */}
					<div className="flex w-52 shrink-0 flex-col gap-2">
						<Label>标识</Label>
						{/* // 图标较多，限高后内部滚动；内容层 p-1.5 避免选中 ring 贴边被裁切 */}
						<div className="scrollbar-thin max-h-60 overflow-auto">
							<div className="p-1.5">
								{ICON_CATEGORIES.map((category, index) => {
									const options = RULE_SPACE_ICON_OPTIONS.filter(
										(option) => option.category === category.key,
									);
									if (options.length === 0) return null;
									return (
										<div key={category.key} className={index > 0 ? "mt-2" : undefined}>
											<div className="mb-1 text-muted-foreground text-xs">{category.label}</div>
											<div className="grid grid-cols-4 gap-2">
												{options.map((option) => (
													<Button
														key={option.key}
														variant="ghost"
														size="icon-sm"
														aria-label={`选择图标 ${option.label}`}
														onClick={() => setIcon(option.key)}
														className={cn(
															"hover:scale-110",
															icon === option.key &&
																"ring-2 ring-ring ring-offset-1 ring-offset-background",
														)}
													>
														<option.icon className="size-5" />
													</Button>
												))}
											</div>
										</div>
									);
								})}
							</div>
						</div>
						{/* // 颜色选择：5 色预设网格 */}
						<div className="grid grid-cols-5 gap-2">
							{SPACE_PRESET_COLORS.map((preset) => (
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
