import {
	AxiomJSTransport, // 负责把日志通过 Axiom SDK 发送到云端。
	ConsoleTransport, // 如果 Axiom 未启用，日志会打印到控制台。
	Logger, //日志主对象。你平时调用的 info()、warn()、error()、debug() 一般都在它上面。
	LogLevel, // 日志级别（info、warn、error 等）。
	type Transport, // 日志通道接口，所有 transport 实现它
} from "@axiomhq/logging"; //通用日志能力 负责“怎么记日志、怎么发日志”

import {
	createAxiomRouteHandler, // 用来包装 Next.js 的 route handler，让请求成功/失败时自动产生日志
	nextJsFormatters, // 针对 Next.js 的日志格式化器
	transformRouteHandlerSuccessResult, // 辅助函数，把 handler 的结果转成日志消息和报告对象
} from "@axiomhq/nextjs"; // 针对 Next.js 场景做的一层官方适配 负责“在 Next.js 这个框架里，什么时候记、记什么、怎么拿到请求上下文”

import type { NextRequest } from "next/server";
import { getSearchParams } from "@/shared/lib/utils";
import { axiomClient } from "./axiom";
import { LocalFileTransport } from "./local-file-transport";

// # 日志基础设施：组装 transports、提供带 module 上下文的子 logger 与 route handler 包装器

// @ 环境与 transports 组装
// 先取出环境变量到局部变量，让 TS 能在条件分支里收窄类型，避免用 ! 非空断言
const axiomDataset = process.env.AXIOM_DATASET;
const axiomToken = process.env.AXIOM_TOKEN;
const isAxiomEnabled = process.env.IS_AXIOM_ENABLED === "true" && !!axiomDataset && !!axiomToken;
// 开发环境额外挂本地文件 transport，把日志落盘到 logs/server.log 方便翻阅排查
const isDev = process.env.NODE_ENV !== "production";

// transports 组合：Axiom(或控制台回退) + 开发环境本地文件；各通道独立、互不影响
// 进 ? 分支时 isAxiomEnabled 已保证 axiomDataset 非空，TS 也能收窄，无需 !
const transports: Transport[] =
	isAxiomEnabled && axiomDataset
		? [
				new AxiomJSTransport({
					axiom: axiomClient,
					dataset: axiomDataset,
				}),
			]
		: [new ConsoleTransport()];
if (isDev) transports.push(new LocalFileTransport());

// transports 至少有一个元素（条件分支两边都给了初始 transport），取出首项后显式判空避免 !
const firstTransport = transports[0];
if (!firstTransport) {
	throw new Error("transports 不能为空");
}

export const logger = new Logger({
	transports: [firstTransport, ...transports.slice(1)],
	formatters: nextJsFormatters, // 程序格式化程序`
});

// @ 子 logger 工厂
// 子 logger 的结构化字段类型
type LogFields = Record<string, unknown>;

// 带 module 上下文的子 logger，每条日志自动注入 module 字段
export interface ScopedLogger {
	debug: (msg: string, fields?: LogFields) => void;
	info: (msg: string, fields?: LogFields) => void;
	warn: (msg: string, fields?: LogFields) => void;
	error: (msg: string, fields?: LogFields) => void;
	flush: () => Promise<void>;
}

// 创建带模块名上下文的子 logger，调用时无需重复写 module 字段
export const createLogger = (module: string): ScopedLogger => ({
	debug: (msg, fields) => logger.debug(msg, { module, ...fields }),
	info: (msg, fields) => logger.info(msg, { module, ...fields }),
	warn: (msg, fields) => logger.warn(msg, { module, ...fields }),
	error: (msg, fields) => logger.error(msg, { module, ...fields }),
	flush: () => logger.flush(),
});

// 将 Error 转为普通对象，保留所有属性（含不可枚举的 message/stack），跳过函数属性
export const serializeError = (e: Error): Record<string, unknown> => {
	const obj: Record<string, unknown> = {};
	for (const key of Object.getOwnPropertyNames(e)) {
		const value: unknown = Reflect.get(e, key);
		if (typeof value !== "function") {
			obj[key] = value;
		}
	}
	return obj;
};

// @ Route Handler 日志包装器
// 带 body 日志的 route handler 包装器：在库的 onSuccess 读 body 前，
// 先把 clone 过的 req 喂给业务 handler，保留原 req 的 body stream 供 onSuccess 消费，
// > 避免 stream 二次读取被 onSuccess 的 catch 静默吞掉
export const withAxiomBodyLog = <TReq extends NextRequest = NextRequest>(
	handler: (
		req: TReq,
		ctx: { params: Promise<Record<string, string | string[]>> },
	) => Promise<Response> | Response,
) =>
	createAxiomRouteHandler(logger, {
		// 当被包装的 route handler 成功返回时，执行这里的日志逻辑。
		onSuccess: async (data) => {
			// 先把成功结果整理成日志消息和报告对象
			//   - 从本次成功请求的数据里
			//  - 提取出一条日志消息 message
			//  - 和一份日志详情对象 report
			const [message, report] = transformRouteHandlerSuccessResult(data);

			// 如果请求方法是 POST / PATCH / PUT，就尝试把请求体 body 也记录到日志里。
			if (["POST", "PATCH", "PUT"].includes(data.req.method)) {
				try {
					// 原 req 的 body stream 未被业务 handler 消费，留给日志层读取
					report.body = await data.req.json();
				} catch {
					// Body可能是空的，无效的JSON
					// 静默跳过添加Body到报告
				}
			}

			// 获取请求参数对象
			report.searchParams = getSearchParams(data.req.url);
			// 参数1：日志级别   参数2：日志消息    参数3：日志详情
			logger.log(getLogLevelFromStatusCode(data.res.status), message, report);
			// 刷新日志缓冲区，确保日志立即发送
			await logger.flush();
		},
	})<TReq>((req, ctx) => {
		// 业务 handler 拿 clone 过的 req，原 req 的 body stream 完整保留给 onSuccess
		return handler(req.clone() as TReq, ctx);
	});

export const withAxiom = createAxiomRouteHandler(logger);

//根据这次响应的 HTTP 状态码，决定日志级别。
// 1xx / 2xx / 3xx: 一般不算严重错误，所以记普通信息日志 info
// 4xx: 表示客户端请求有问题，比如参数错了、未登录、没权限、找不到资源。这类通常记成 warn
// 5xx: 表示服务器内部出错。这类更严重，所以记成 error
const getLogLevelFromStatusCode = (statusCode: number) => {
	if (statusCode >= 100 && statusCode < 400) {
		return LogLevel.info;
	} else if (statusCode >= 400 && statusCode < 500) {
		return LogLevel.warn;
	} else if (statusCode >= 500) {
		return LogLevel.error;
	}

	return LogLevel.info;
};
