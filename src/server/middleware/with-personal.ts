// 个人空间接口高阶函数：在统一身份解析（cookies session / API Key）之上叠加套餐与权限点校验
//
// 个人空间同时服务三类接入：网页登录（cookies）、SDK / MCP（Bearer API Key），
// 身份统一由 resolveContext 解析。与 withSession 的差异在于：
// withSession 只解决"你是谁"，withPersonal 进一步约束"你的套餐 / 权限点是否允许访问该接口"。
// 套餐（UserPlan）不入 session，需实时查库；权限点来自 RBAC action 清单。
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { AiSpecError, toErrorResponse } from "@/server/errors/http-error";
import { withAxiomBodyLog } from "@/server/infrastructure/axiom/server";
import type { Action } from "@/server/rbac/actions";
import { formatScope } from "@/server/rbac/scopes";
import type { UserPlan } from "@/shared/db/generator/client";
import { getSearchParams } from "@/shared/lib/utils";
import { resolveContext } from "./resolve-context";

type RouteContext = { params: Promise<Record<string, string | string[]>> };

type PersonalHandlerArgs = {
	req: NextRequest;
	ctx: RouteContext;
	session: Session;
	searchParams: Record<string, string>;
};

type PersonalHandler = (args: PersonalHandlerArgs) => Promise<Response> | Response;

type PersonalOptions = {
	// 允许访问的套餐档位；省略表示不限套餐（待订单系统落地后生效）
	plans?: readonly UserPlan[];
	// 该接口要求的权限点，仅对 API Key 接入生效
	permissions?: readonly Action[];
};

// plans 暂未消费（待订单系统落地），permissions 已实现：仅对 API Key 接入做 scope 收紧校验
export const withPersonal = (handler: PersonalHandler, { permissions }: PersonalOptions = {}) =>
	withAxiomBodyLog(async (req: NextRequest, ctx: RouteContext) => {
		// 这两个变量先声明后赋值，是为了让 try 内的异步逻辑保持线性，不被中间声明打断
		let session: Session | null = null;
		let searchParams: Record<string, string> = {};

		try {
			const resolved = await resolveContext(req);
			session = resolved.session;
			searchParams = getSearchParams(req.url);

			// ! 权限校验：仅 API Key 接入（scopes 非 null）时收紧。
			// ! cookies 接入 scopes 为 null，跳过校验——浏览器用户权限由 owner_id 数据隔离兜底。
			// ! API Key 的 scope 只能收紧（限制钥匙能做什么），不能放宽超过浏览器登录的基线。
			const { scopes } = resolved;
			if (permissions && scopes) {
				const missing = permissions.filter((p) => !scopes.includes(p));
				if (missing.length > 0) {
					// 翻译成「中文名(scope 字符串)」格式，让调用方既看懂权限含义又能对照配置
					const missingLabel = missing.map((s) => formatScope(s)).join("、");
					throw new AiSpecError({
						code: "FORBIDDEN",
						message: `当前 API Key 权限不足，缺少所需 scope：${missingLabel}`,
					});
				}
			}

			// ? TODO: 套餐校验——根据 plans 配置，比对实时查库得到的 userPlan（待订单系统落地）

			return await handler({ req, ctx, session, searchParams });
		} catch (e) {
			return toErrorResponse(e);
		}
	});
