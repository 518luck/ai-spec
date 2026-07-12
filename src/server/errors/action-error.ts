import type { ErrorCode } from "@/shared/lib/zod/schemas/error";

// # ActionError：Server Action 可暴露给前端的业务错误，复用项目统一的 ErrorCode
export class ActionError extends Error {
	code: ErrorCode;

	constructor({ code, message }: { code: ErrorCode; message: string }) {
		super(message);

		this.code = code;
	}
}
