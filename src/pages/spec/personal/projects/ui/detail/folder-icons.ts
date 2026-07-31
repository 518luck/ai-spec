import "server-only";

// # VSCode 风格文件夹图标：用 material-icon-theme 自带清单解析文件夹名，动态加载对应 SVG

import manifest from "material-icon-theme/dist/material-icons.json";
import type { StaticImageData } from "next/image";

/** 一对文件夹图标：闭合态 + 展开态（Next 静态导入的 SVG 资源） */
export interface FolderIconPair {
	closed: StaticImageData;
	open: StaticImageData;
}

// > 文件夹名 → iconId（如 "cargo" → "folder-rust"）；material-icons.json 含 4654 条别名，未命中回退通用 folder
export const resolveFolderIconId = (folderName: string): string =>
	manifest.folderNames[folderName] ?? manifest.folder;

// 项目根文件夹 iconId（"folder-root"）
export const ROOT_FOLDER_ICON_ID: string = manifest.rootFolder;

// 通用兜底 iconId（"folder"），未命中专属映射时使用
export const DEFAULT_FOLDER_ICON_ID: string = manifest.folder;

/**
 * 动态加载一对图标（closed + open），服务端调用
 *
 * Turbopack 对"静态前缀 + 变量后缀"的 import() 按需拆 chunk，只有实际请求的图标才下发；
 * 返回 StaticImageData 供客户端 <Image> 走 isStaticImport 分支，svg 自动 unoptimized
 */
export const loadFolderIconPair = async (iconId: string): Promise<FolderIconPair> => {
	const [closed, open] = await Promise.all([
		import(`material-icon-theme/icons/${iconId}.svg`),
		import(`material-icon-theme/icons/${iconId}-open.svg`),
	]);
	return { closed: closed.default, open: open.default };
};
