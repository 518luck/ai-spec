// # 页面内容容器：统一的内边距与 flex 布局外壳
// ? TODO 页面鉴权待补：当前未做权限校验，计划在此处加入
export function PageContainer({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-1 flex-col p-4 md:px-6">{children}</div>;
}
