import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError: async (e) => {
    if (e instanceof Error) {
      return e.message;
    }

    return "发生未知错误";
  },
});
