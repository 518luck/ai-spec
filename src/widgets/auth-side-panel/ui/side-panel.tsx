// # 鉴权页右侧侧边面板：纯装饰性占位容器，小屏隐藏
export function SidePanel() {
	return (
		<div className="relative hidden h-full overflow-hidden border-gray-500 border-l bg-background min-[900px]:flex"></div>
	);
}
