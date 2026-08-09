// # 健康检查端点：供容器编排（docker compose healthcheck）探活
// > 故意保持轻量：不连库、不走 Axiom，只确认进程存活并能响应请求

import type { NextRequest } from "next/server";

// GET /api/health：返回 200 + 时间戳，供 healthcheck 判活
export const GET = async (_request: NextRequest): Promise<Response> =>
	Response.json({ status: "ok", timestamp: Date.now() });
