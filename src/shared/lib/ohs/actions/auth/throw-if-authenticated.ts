import { ActionError } from "@/shared/lib/ohs/actions/utils/action-error";
import { auth } from "@/shared/lib/auth/auth";
import { createMiddleware } from "next-safe-action";

/**
 * @function throwIfAuthenticated
 * @description
 * `createMiddleware().define(async ...)` 用来定义 next-safe-action 的中间件。
 * `define` 会给回调参数里的 `next`、`ctx` 等字段提供类型推导；
 * `async` 表示中间件里可以等待服务端异步逻辑，例如读取当前登录会话。
 *
 * 如果用户已登录，就抛出错误。常用于注册、登录等入口。
 */
export const throwIfAuthenticated = createMiddleware().define(
  // next：继续执行后面的 middleware/action
  // ctx：当前 action 上下文
  // clientInput：客户端传进 action 的原始输入
  // metadata：action 上配置的元信息
  // bindArgsClientInputs：绑定参数传进来的输入
  async ({ next, ctx }) => {
    const session = await auth();

    if (session) {
      throw new ActionError({ code: "FORBIDDEN", message: "您已经登录" });
    }

    return next({ ctx });
  },
);
