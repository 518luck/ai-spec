import { createSafeActionClient } from "next-safe-action";
import { logger } from "../lib/axiom/server";
import { after } from "next/server";

// 统一处理 Server Action 里的异常。
export const actionClient = createSafeActionClient({
  handleServerError: async (e) => {
    logger.error(e.message, e);
    after(logger.flush());

    return e.message;
  },
});
