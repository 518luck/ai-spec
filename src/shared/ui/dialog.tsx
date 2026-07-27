"use client";

// # Dialog 弹窗组合（基于 base-ui）：Portal + 遮罩 + 居中面板，内置 ScrollArea 内容滚动与可选关闭按钮

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="dialog-overlay"
			className={cn(
				"data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-black/50 duration-200 ease-out data-closed:animate-out data-open:animate-in supports-backdrop-filter:backdrop-blur-lg",
				className,
			)}
			{...props}
		/>
	);
}

// ! 面板定位用 inset-0 + m-auto 居中，不用 top/left-1/2 + -translate-1/2：
// ! tw-animate 的 zoom/slide 关键帧会整个改写 transform，起始帧丢掉 -50% 偏移，弹窗会从偏左上斜着飘到中间。
// ! margin auto 居中不占用 transform，缩放和位移动画才是纯的
const DIALOG_CONTENT_CLASS =
	"fixed inset-0 z-50 m-auto grid h-fit max-h-[85vh] w-full max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-xl bg-popover p-0 text-popover-foreground text-sm outline-none ring-1 ring-foreground/10 sm:max-w-md";

// 默认进出场：淡入 + 轻微放大 + 自下微升
const DIALOG_CONTENT_ANIMATION_CLASS =
	"data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-3 data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-bottom-2 duration-200 ease-out data-closed:animate-out data-open:animate-in";

function DialogContent({
	className,
	children,
	showCloseButton = true,
	scrollable = true,
	animated = true,
	...props
}: DialogPrimitive.Popup.Props & {
	showCloseButton?: boolean;
	/** 是否用 ScrollArea 包裹内容（默认开启）；内部自带滚动的组件（如 CodeMirror）应关闭，避免双重滚动冲突 */
	scrollable?: boolean;
	/** 是否使用内置的 CSS 进出场（默认开启）；由 motion 接管面板动画时关闭，避免两套动画叠加打架 */
	animated?: boolean;
}) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Popup
				data-slot="dialog-content"
				className={cn(DIALOG_CONTENT_CLASS, animated && DIALOG_CONTENT_ANIMATION_CLASS, className)}
				{...props}
			>
				{/* // ! ScrollArea 包裹内容让超长弹窗自动滚动；scrollable=false 时直接渲染 children（供 CodeMirror 等自带滚动的组件使用，避免双重滚动冲突） */}
				{scrollable ? <ScrollArea className="max-h-[inherit]">{children}</ScrollArea> : children}
				{showCloseButton && (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						render={<Button variant="ghost" className="absolute top-4 right-4" size="icon-sm" />}
					>
						<XIcon />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Popup>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-header"
			className={cn("flex flex-col gap-2 border-b px-6 py-4", className)}
			{...props}
		/>
	);
}

// Dialog 内容主体：统一 px-6 py-4 内边距 + bg-muted 灰底，与 Header/Footer 对齐
function DialogContentBody({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-content-body"
			className={cn("bg-muted px-6 py-4", className)}
			{...props}
		/>
	);
}

function DialogFooter({
	className,
	showCloseButton = false,
	children,
	...props
}: React.ComponentProps<"div"> & {
	showCloseButton?: boolean;
}) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn(
				"flex flex-col-reverse gap-2 bg-muted px-6 pt-4 pb-4 sm:flex-row sm:justify-end",
				className,
			)}
			{...props}
		>
			{children}
			{showCloseButton && (
				<DialogPrimitive.Close render={<Button variant="outline" />}>Close</DialogPrimitive.Close>
			)}
		</div>
	);
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn("font-medium text-lg leading-none", className)}
			{...props}
		/>
	);
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn(
				"text-muted-foreground text-sm leading-6 *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogContentBody,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
