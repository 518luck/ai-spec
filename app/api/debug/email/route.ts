import { type NextRequest, NextResponse } from "next/server";
import { sendBatchEmail, sendEmail } from "@/server/infrastructure/email";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const to = searchParams.get("to") || "1512013298@qq.com";
	const subject = searchParams.get("subject") || "Debug 测试邮件";

	const results: Record<string, unknown> = {};
	results.provider = process.env.EMAIL_PROVIDER || "resend";

	// 单封发送测试
	try {
		const singleResult = await sendEmail({
			to,
			subject: `${subject} - 单封`,
			text: "这是一封通过 sendEmail 发送的测试邮件。",
		});
		results.single = {
			ok: singleResult?.ok ?? false,
			id: singleResult?.id ?? null,
			error: singleResult?.error ?? null,
		};
	} catch (e) {
		results.single = { ok: false, error: String(e) };
	}

	// 批量发送测试
	try {
		const batchResult = await sendBatchEmail([
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
		results.batch = batchResult;
	} catch (e) {
		results.batch = { ok: false, error: String(e) };
	}

	return NextResponse.json(results);
}
