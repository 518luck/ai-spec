// 个人空间接口高阶函数：在统一身份解析（cookies session / API Key）之上叠加套餐与权限点校验
//
// 个人空间同时服务三类接入：网页登录（cookies）、SDK / MCP（Bearer API Key），
// 身份统一由 resolveContext 解析。与 withSession 的差异在于：
// withSession 只解决"你是谁"，withPersonal 进一步约束"你的套餐 / 权限点是否允许访问该接口"。
// 套餐（UserPlan）不入 session，需实时查库；权限点来自 RBAC action 清单。
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { toErrorResponse } from "@/server/errors/http-error";
import { withAxiom } from "@/server/infrastructure/axiom/server";
import type { Action } from "@/server/rbac/actions";
import type { UserPlan } from "@/shared/db/generator/client";
import { getSearchParams } from "@/shared/lib/utils";
import { resolveContext } from "./resolve-context";

// Next.js App Router 动态路由上下文类型
type RouteContext = { params: Promise<Record<string, string | string[]>> };

// withPersonal 传给业务 handler 的全部上下文：请求对象、路由上下文、身份 session 与 URL 查询参数
type PersonalHandlerArgs = {
	req: NextRequest;
	ctx: RouteContext;
	session: Session;
	searchParams: Record<string, string>;
};

// 被 withPersonal 包装的业务 handler 签名：接收单一对象参数
type PersonalHandler = (args: PersonalHandlerArgs) => Promise<Response> | Response;

// withPersonal 的配置项：声明该接口要求的套餐档位与权限点
type PersonalOptions = {
	// 允许访问的套餐档位；省略表示不限套餐
	plans?: readonly UserPlan[];
	// 该接口需要存入 / 校验的权限点，取自 RBAC action 清单
	permissions?: readonly Action[];
};

// 高阶函数：把业务 handler 转换为带身份解析、套餐与权限点校验的 Next.js route handler
export const withPersonal = (
	handler: PersonalHandler,
	{ plans, permissions }: PersonalOptions = {},
) =>
	withAxiom(async (req: NextRequest, ctx: RouteContext) => {
		// 后续步骤填充的中间值，统一在此提前声明，保持异步逻辑线性
		let session: Session | null = null;
		let searchParams: Record<string, string> = {};
		const userPlan: UserPlan | null = null;
		const grantedPermissions: readonly Action[] = [];

		try {
			// 统一身份解析：cookies session 或 API Key（含限流），结果进 session
			const resolved = await resolveContext(req);
			session = resolved.session;
			searchParams = getSearchParams(req.url);

			// TODO: 套餐校验——根据 plans 配置，比对实时查库得到的 userPlan
			// TODO: 权限点校验——根据 permissions 配置，比对 grantedPermissions

			const response = await handler({
				req,
				ctx,
				session,
				searchParams,
			});

			return response;
		} catch (e) {
			return toErrorResponse(e);
		}
	});
