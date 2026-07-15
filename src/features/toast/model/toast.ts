// # 封装 sonner toast：每条 toast 自动带"复制"按钮
// > 调用方照常用 toast.success()/toast.error()，底层自动注入复制 action

import copy from "copy-to-clipboard";
import { toast as rawToast } from "sonner";

// > 复制 toast 文本到剪贴板（用 copy-to-clipboard 自动处理非 HTTPS / 旧浏览器的回退）
const copyToastText = (text: string) => {
	copy(text);
	rawToast.success("已复制", { duration: 1500 });
};

// > 封装每种类型，自动注入复制按钮；message 允许 undefined（和 sonner 原版一致）
const createTypedToast =
	(type: "success" | "error" | "warning" | "info" | "loading") =>
	(message?: string, options?: Record<string, unknown>) => {
		const text = message ?? "";
		return rawToast[type](text, {
			...options,
			action: {
				label: "复制",
				onClick: () => copyToastText(text),
			},
		});
	};

export const toast = {
	success: createTypedToast("success"),
	error: createTypedToast("error"),
	warning: createTypedToast("warning"),
	info: createTypedToast("info"),
	loading: createTypedToast("loading"),
	message: (message?: string, options?: Record<string, unknown>) => {
		const text = message ?? "";
		return rawToast(text, {
			...options,
			action: {
				label: "复制",
				onClick: () => copyToastText(text),
			},
		});
	},
	// 透传 sonner 原生方法（不需要复制按钮的）
	dismiss: rawToast.dismiss,
};
