import { headers } from "next/headers";

// # 取当前请求来源 IP：优先读 x-forwarded-for，回退 x-real-ip
// > 用于按 IP 限流；取不到时回退 0.0.0.0，这些请求会共用同一限流桶
export const getIP = async () => {
	const FALLBACK_IP_ADDRESS = "0.0.0.0";
	// 优先取 x-forwarded-for（代理、CDN、负载均衡器转发时加上，常带客户端真实 IP）
	const forwardedFor = (await headers()).get("x-forwarded-for");

	if (forwardedFor) {
		return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
	}
	// x-real-ip 这也是很多反向代理会补的真实 IP 头
	return (await headers()).get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
};
