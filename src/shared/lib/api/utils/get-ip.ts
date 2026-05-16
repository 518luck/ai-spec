import { headers } from "next/headers";

//这是一个“取当前请求来源 IP”的工具函数。
export const getIP = async () => {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  // 1. headers()
  //    拿到当前这次请求的请求头。
  // 2. .get("x-forwarded-for")
  //    优先取 x-forwarded-for。
  //    这个请求头通常是代理、CDN、负载均衡器转发时加上的，里面常常带客户端真实 IP。
  const forwardedFor = (await headers()).get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }
  // x-real-ip 这也是很多反向代理会补的真实 IP 头
  return (await headers()).get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
};
