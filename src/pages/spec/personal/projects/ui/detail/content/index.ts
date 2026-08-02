// # detail/content：项目详情右侧内容区组件
// > 主组件（编排）：RightPane —— 鸟瞰图（空态 / 卡片列表），入口从这里导入
// > 子组件：AgentsMdCardGrid（鸟瞰图卡片网格）
// > 编辑器视图（MarkdownEditor 内容区 + 标题栏状态栏）由 detail-client 直接编排，不在此目录

export { AgentsMdCardGrid } from "./agents-md-cards";
export { RightPane } from "./right-pane";
