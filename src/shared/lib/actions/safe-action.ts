import { createSafeActionClient } from "next-safe-action";
import { after } from "next/server";
import {
  createLogger,
  serializeError,
} from "@/shared/lib/infrastructure/axiom/server";

// Server Action 专用日志器，每条日志自动带 module: "server-action"
const log = createLogger("server-action");

// 统一处理 Server Action 里的异常。
export const actionClient = createSafeActionClient({
  handleServerError: async (e) => {
    log.error(e.message, serializeError(e));
    after(log.flush());

    return e.message;
  },
});
