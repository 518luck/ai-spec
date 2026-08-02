// # detail/nav：项目详情左侧导航区（文件夹树侧栏）组件
// > 主组件（编排）：FileTree —— 文件树 + 新建/删除/刷新/展开收起，入口从这里导入
// > 子组件：BreadcrumbNav（面包屑）、CreateFileDialog/CreateFolderDialog（新建弹窗）、SidebarResizeHandle（侧栏拖拽手柄）

export { BreadcrumbNav } from "./breadcrumb-nav";
export { CreateFileDialog } from "./create-file-dialog";
export { CreateFolderDialog } from "./create-folder-dialog";
export { FileTree } from "./file-tree";
export { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH, SidebarResizeHandle } from "./sidebar-resize-handle";
