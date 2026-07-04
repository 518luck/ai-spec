"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Icons } from "@/shared/ui/icons";

type RequireLoginDialogProps = {
	title?: string;
	description?: React.ReactNode;
	showBackButton?: boolean;
	onBack?: () => void;
	onLogin?: () => void;
};

// 未登录时展示的不可关闭登录提示弹窗
export function RequireLoginDialog({
	title = "需要登录",
	description = "请登录后查看此页面内容。",
	showBackButton = true,
	onBack,
	onLogin,
}: RequireLoginDialogProps): React.JSX.Element {
	const router = useRouter();
	const canGoBack = useCanGoBack();

	const handleBack = onBack ?? (() => router.back());
	const handleLogin = onLogin ?? (() => router.push("/spec/login"));

	const shouldShowBack = showBackButton && canGoBack;

	return (
		<Dialog open disablePointerDismissal onOpenChange={() => {}}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<Icons.login className="size-5 text-muted-foreground" />
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					{shouldShowBack && (
						<Button variant="outline" onClick={handleBack}>
							返回
						</Button>
					)}
					<Button onClick={handleLogin}>去登录</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// 检测浏览器是否有可用于返回的历史记录
const useCanGoBack = (): boolean =>
	useSyncExternalStore(
		() => () => {},
		() => window.history.length > 1,
		() => false,
	);
