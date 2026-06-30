import { ActionError } from "@/shared/lib/ohs/actions/utils/action-error";
import {
  createLogger,
  serializeError,
} from "@/shared/lib/infrastructure/axiom/server";
import { createSafeActionClient } from "next-safe-action";
import { after } from "next/server";
import { auth } from "@/shared/lib/auth/auth";

// Server Action 专用日志器，每条日志自动带 module: "server-action"
const log = createLogger("server-action");

// 统一处理 Server Action 里的异常：记录日志，并对内部错误脱敏
export const actionClient = createSafeActionClient({
  handleServerError: async (e) => {
    log.error(e.message, serializeError(e));
    after(log.flush());

    // ActionError 是预期内的业务错误，可直接返回给前端
    if (e instanceof ActionError) {
      return e.message;
    }

    // 其他未预期错误（数据库、网络、库内部等）不暴露原始信息
    return "服务器出错，请稍后重试";
  },
});

// 只要求用户已登录
export const authUserActionClient = actionClient.use(async ({ next }) => {
  const session = await auth();

  if (!session?.user.id) {
    throw new ActionError({ code: "UNAUTHORIZED", message: "请先登录" });
  }

  return next({
    ctx: {
      user: session.user,
    },
  });
});
