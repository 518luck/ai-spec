// # 登录方式分隔线：在第三方登录按钮之间展示「or」分隔线
export function AuthMethodsSeparator() {
	return (
		<div className="my-3 flex shrink items-center justify-center gap-2">
			<div className="grow basis-0 border-neutral-200 border-b" />
			<span className="font-medium text-content-muted text-xs uppercase leading-none">or</span>
			<div className="grow basis-0 border-neutral-200 border-b" />
		</div>
	);
}
