// # 封装 sonner toast：每条 toast 自动带"复制"按钮
// > 调用方照常用 toast.success()/toast.error()，底层自动注入复制 action

import copy from "copy-to-clipboard";
import { type ExternalToast, toast as rawToast } from "sonner";
import { Icons } from "@/shared/ui/icons";

// > 封装每种类型，自动注入复制按钮
const createTypedToast =
	(type: "success" | "error" | "warning" | "info" | "loading") =>
	(message?: string, options?: ExternalToast) => {
		const text = message ?? "";
		const id = rawToast[type](text, options);
		rawToast[type](text, {
			...options,
			id,
			action: {
				label: <Icons.copy className="size-4" />,
				onClick: () => {
					copy(text);
					rawToast.success("已复制", { id });
				},
			},
		});
		return id;
	};

export const toast = {
	success: createTypedToast("success"),
	error: createTypedToast("error"),
	warning: createTypedToast("warning"),
	info: createTypedToast("info"),
	loading: createTypedToast("loading"),
	message: (message?: string, options?: ExternalToast) => {
		const text = message ?? "";
		const id = rawToast(text, options);
		rawToast(text, {
			...options,
			id,
			action: {
				label: <Icons.copy className="size-4" />,
				onClick: () => {
					copy(text);
					rawToast.success("已复制", { id });
				},
			},
		});
		return id;
	},
	dismiss: rawToast.dismiss,
};
