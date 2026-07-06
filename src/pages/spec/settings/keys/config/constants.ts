import dayjs from "dayjs";

import type { ExpiryPresetValue } from "@/pages/spec/settings/keys/ui/key-form-fields";

// 每页固定展示的密钥条数
// 放在 config segment（无 "use client"），服务端组件与客户端组件都能安全导入，
// 避免 Server Component 从 Client Component 导入常量时被 RSC 替换为客户端引用代理
export const PAGE_SIZE = 10;

// 把弹窗选的过期预设/日期换算成后端接受的 ISO 字符串；null 表示永不过期
export const computeExpires = (preset: ExpiryPresetValue, date?: Date): string | null => {
	switch (preset) {
		case "never":
			return null;
		case "7d":
			return dayjs().add(7, "day").toISOString();
		case "30d":
			return dayjs().add(30, "day").toISOString();
		case "90d":
			return dayjs().add(90, "day").toISOString();
		case "custom":
			return date ? date.toISOString() : null;
	}
};
