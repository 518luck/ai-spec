import type { TranslationProvider } from "@/server/infrastructure/translation";
import { createTencentProvider } from "@/server/infrastructure/translation";

// # 翻译适配器入口：进程内单例；缺密钥在首次创建时抛错

let cached: TranslationProvider | null = null;

// 获取翻译 provider（业务/队列只依赖这一层，不直接碰腾讯 client）
export const getTranslationProvider = (): TranslationProvider => {
	if (!cached) {
		cached = createTencentProvider();
	}
	return cached;
};
