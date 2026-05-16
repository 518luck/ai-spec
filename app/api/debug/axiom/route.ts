import { NextResponse } from "next/server";

import { logger } from "@/shared/lib/axiom/server";

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
