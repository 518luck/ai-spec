import { NextResponse } from "next/server";

import { logger } from "@/server/infrastructure/axiom/server";

// # Axiom 日志链路调试端点（写入测试日志并返回 marker）

export async function GET() {
	const marker = `axiom-test-${Date.now()}`;

	logger.info("Axiom test log", {
		marker,
		source: "debug-route",
	});

	await logger.flush();

	return NextResponse.json({
		ok: true,
		marker,
	});
}
