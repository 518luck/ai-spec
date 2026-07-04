// TODO可以在这个地方页面鉴权
export function PageContainer({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-1 flex-col p-4 md:px-6">{children}</div>;
}
