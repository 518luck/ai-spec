// # VSCode 风格文件夹图标：material-icon-theme 的 SVG 资源与"文件夹名 → 图标"解析

import folder from "material-icon-theme/icons/folder.svg";
import folderApi from "material-icon-theme/icons/folder-api.svg";
import folderApiOpen from "material-icon-theme/icons/folder-api-open.svg";
import folderApp from "material-icon-theme/icons/folder-app.svg";
import folderAppOpen from "material-icon-theme/icons/folder-app-open.svg";
import folderOpen from "material-icon-theme/icons/folder-open.svg";
import folderPrisma from "material-icon-theme/icons/folder-prisma.svg";
import folderPrismaOpen from "material-icon-theme/icons/folder-prisma-open.svg";
import folderPublic from "material-icon-theme/icons/folder-public.svg";
import folderPublicOpen from "material-icon-theme/icons/folder-public-open.svg";
import folderRoot from "material-icon-theme/icons/folder-root.svg";
import folderRootOpen from "material-icon-theme/icons/folder-root-open.svg";
import folderSrc from "material-icon-theme/icons/folder-src.svg";
import folderSrcOpen from "material-icon-theme/icons/folder-src-open.svg";

/** 一对文件夹图标：闭合态 + 展开态（Next 静态导入的 SVG 资源，取 .src 渲染） */
export interface FolderIconPair {
	closed: { src: string };
	open: { src: string };
}

/** 项目根文件夹图标 */
export const rootFolderIcon: FolderIconPair = { closed: folderRoot, open: folderRootOpen };

/** 通用文件夹图标：无专属映射时的回退 */
const defaultFolderIcon: FolderIconPair = { closed: folder, open: folderOpen };

// > 文件夹名 → 专属图标；键值遵循 material-icon-theme 官方 folderNames 映射（全量清单 444K 不进包，只登记用到的）
const folderIconsByName: Record<string, FolderIconPair> = {
	src: { closed: folderSrc, open: folderSrcOpen },
	app: { closed: folderApp, open: folderAppOpen },
	api: { closed: folderApi, open: folderApiOpen },
	prisma: { closed: folderPrisma, open: folderPrismaOpen },
	web: { closed: folderPublic, open: folderPublicOpen },
};

/** 按文件夹名解析图标，未命中专属映射时回退到通用文件夹 */
export const resolveFolderIcon = (folderName: string): FolderIconPair =>
	folderIconsByName[folderName] ?? defaultFolderIcon;
