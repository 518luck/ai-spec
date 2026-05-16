import { createSafeActionClient } from "next-safe-action";
import { logger } from "../lib/axiom/server";
import { after } from "next/server";

export const actionClient = createSafeActionClient({
  handleServerError: async (e) => {
    logger.error(e.message, e);
    after(logger.flush());

    if (e instanceof Error) {
      return e.message;
    }

    return "发生未知错误";
  },
});
