import { createSafeActionClient } from "next-safe-action";
import { after } from "next/server";
import { logger } from "../axiom/server";

// 统一处理 Server Action 里的异常。
export const actionClient = createSafeActionClient({
  handleServerError: async (e) => {
    logger.error(e.message, e);
    after(logger.flush());

    return e.message;
  },
});
