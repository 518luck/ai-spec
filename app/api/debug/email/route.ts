import { NextRequest, NextResponse } from "next/server";
import {
  sendEmailViaResend,
  sendBatchEmailViaResend,
} from "@/shared/lib/infrastructure/email/send-via-resend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") || "1512013298@qq.com";
  const subject = searchParams.get("subject") || "Debug 测试邮件";

  const results: Record<string, unknown> = {};

  const hasApiKey = !!process.env.RESEND_API_KEY;
  results.hasApiKey = hasApiKey;

  if (!hasApiKey) {
    results.note = "RESEND_API_KEY 未设置，sendEmailViaResend 将跳过发送";
    await sendEmailViaResend({
      to,
      subject,
      text: "这是一封测试邮件。",
    });
    results.single = { skipped: true, reason: "no-api-key" };
    results.batch = { skipped: true, reason: "no-api-key" };
    return NextResponse.json(results);
  }

  // 单封发送测试
  try {
    const singleResult = await sendEmailViaResend({
      to,
      subject: `${subject} - 单封`,
      text: "这是一封通过 sendEmailViaResend 发送的测试邮件。",
    });
    results.single = {
      ok: !singleResult?.error,
      data: singleResult?.data ?? null,
      error: singleResult?.error ?? null,
    };
  } catch (e) {
    results.single = { ok: false, error: String(e) };
  }

  // 批量发送测试
  try {
    const batchResult = await sendBatchEmailViaResend([
      {
        to,
        subject: `${subject} - 批量1`,
        text: "批量测试邮件 1",
      },
      {
        to,
        subject: `${subject} - 批量2`,
        text: "批量测试邮件 2",
      },
    ]);
    results.batch = {
      ok: !batchResult?.error,
      data: batchResult?.data ?? null,
      error: batchResult?.error ?? null,
    };
  } catch (e) {
    results.batch = { ok: false, error: String(e) };
  }

  return NextResponse.json(results);
}
