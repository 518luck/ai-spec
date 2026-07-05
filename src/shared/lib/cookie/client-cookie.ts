// 客户端 cookie 读写工具：基于现代 Cookie Store API（异步、规范推荐）。
// 旧浏览器（Safari < 18.4、Firefox < 140 等）不支持 cookieStore 时写入静默失败，
// 业务上等价于「回到默认值」，不会崩溃；下次访问会重新尝试写入。

// Cookie 写入选项：对外统一暴露 maxAge（业务常用秒数），内部转成 cookieStore 需要的 expires
export interface CookieOptions {
	path?: string;
	maxAge?: number;
	sameSite?: "strict" | "lax" | "none";
}

// 把 maxAge（秒）转成 expires（绝对时间戳），用于 cookieStore.set
const maxAgeToExpires = (maxAge?: number): number | null => {
	if (typeof maxAge !== "number") return null;
	return Date.now() + maxAge * 1000;
};

// 写入 cookie：基于 Cookie Store API，不返回 Promise（fire-and-forget）。
// 旧浏览器（无 cookieStore）静默跳过，业务回退到默认值。
export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
	if (typeof cookieStore === "undefined") return;
	// 异步写入但不 await，调用方不需要等待 cookie 落盘
	// 注意：CookieInit 类型用 expires（绝对时间戳），不接受 maxAge，这里做一次转换
	void cookieStore.set({
		name,
		value,
		path: options.path ?? "/",
		expires: maxAgeToExpires(options.maxAge),
		sameSite: options.sameSite ?? "lax",
		domain: null,
	});
};

// 读取单个 cookie 的值；找不到或不在浏览器环境返回 undefined
export const getCookie = (name: string): string | undefined => {
	if (typeof document === "undefined") return undefined;
	const prefix = `${name}=`;
	const match = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
	return match?.slice(prefix.length);
};
