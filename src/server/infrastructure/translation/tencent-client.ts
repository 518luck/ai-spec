import Bottleneck from "bottleneck";
import { tmt } from "tencentcloud-sdk-nodejs-tmt";

import type { TranslateTextsOptions, TranslateTextsResult, TranslationProvider } from "./types";

// # 腾讯云机器翻译：官方 tmt SDK 负责签名与请求，Bottleneck 负责出站 QPS/并发

const TmtClient = tmt.v20180321.Client;

// TextTranslate 默认约 5 次/秒；并发与间隔略留余量
const DEFAULT_MAX_CONCURRENT = 2;
// 两次启动最小间隔，约 4.5 QPS
const DEFAULT_MIN_INTERVAL_MS = 220;
// 每秒令牌桶容量（与腾讯 frequency limit 对齐）
const DEFAULT_RESERVOIR = 5;
// 单次 SourceText 上限 6000 字符
const MAX_SOURCE_CHARS = 6000;
// 限流错误最多重试次数（不含首次）
const MAX_RETRIES = 3;

// TextTranslate 成功响应（SDK request 解包后的业务字段）
type TextTranslateResult = {
	TargetText?: string; // 译文
	Source?: string; // 源语言（如 en）
	Target?: string; // 目标语言（如 zh）
	UsedAmount?: number; // 本次消耗字符数
	RequestId?: string; // 请求 ID，排障用
};

// 业务语言码 → 腾讯 TMT 语言码
const toTmtLang = (lang: TranslateTextsOptions["sourceLang"] | "ZH"): string => {
	if (!lang || lang === "auto") {
		// 待译队列里基本是英文；TMT Source 必填且文档未列 auto，默认 en
		return "en";
	}
	if (lang === "EN") {
		return "en";
	}
	if (lang === "ZH") {
		return "zh";
	}
	return "en";
};

// 是否为腾讯侧限流/频控类错误（可退避重试）
const isRateLimitError = (error: unknown): boolean => {
	const message = error instanceof Error ? error.message : String(error);
	return /frequency limit|exceeds the frequency|RequestLimitExceeded|RequestLimit|限频|超过频率/i.test(
		message,
	);
};

// 腾讯 TMT provider：缺密钥直接抛错，避免静默不翻却无感知
export const createTencentProvider = (): TranslationProvider => {
	const secretId = process.env.TENCENT_SECRET_ID?.trim() ?? ""; // 云 API 密钥 ID
	const secretKey = process.env.TENCENT_SECRET_KEY?.trim() ?? ""; // 云 API 密钥 Key
	const region = process.env.TENCENT_TMT_REGION?.trim() || "ap-guangzhou"; // 调用地域，默认广州
	const projectId = Number(process.env.TENCENT_TMT_PROJECT_ID ?? "0") || 0; // 腾讯云项目 ID，默认 0
	const maxConcurrent = Math.max(
		1,
		Number(process.env.TENCENT_TMT_CONCURRENCY) || DEFAULT_MAX_CONCURRENT,
	);
	const minTime = Math.max(
		0,
		Number(process.env.TENCENT_TMT_MIN_INTERVAL_MS) || DEFAULT_MIN_INTERVAL_MS,
	);
	const reservoir = Math.max(1, Number(process.env.TENCENT_TMT_RESERVOIR) || DEFAULT_RESERVOIR);

	// ! 密钥必须成对配置；缺了立刻失败，方便在 worker 日志里发现
	if (!secretId || !secretKey) {
		throw new Error(
			"未配置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY，无法调用腾讯云机器翻译（请写入 .env 后重启 worker）",
		);
	}

	// 出站调度：并发 + 最小间隔 + 每秒令牌桶，避免打爆 TMT 5 次/秒
	const limiter = new Bottleneck({
		maxConcurrent,
		minTime,
		reservoir,
		reservoirRefreshAmount: reservoir,
		reservoirRefreshInterval: 1000,
	});

	// 限流失败时按次数退避重试；返回等待毫秒数即再次入队
	limiter.on("failed", (error, jobInfo) => {
		if (!isRateLimitError(error) || jobInfo.retryCount >= MAX_RETRIES) {
			return;
		}
		const backoffMs = 400 * 2 ** jobInfo.retryCount + Math.floor(Math.random() * 200);
		return backoffMs;
	});

	// SDK 生成的 Client 目前只声明了 ImageTranslateLLM，TextTranslate 走通用 request
	const client = new TmtClient({
		credential: { secretId, secretKey },
		region,
		profile: {
			httpProfile: {
				endpoint: "tmt.tencentcloudapi.com",
			},
		},
	});

	// 单条 TextTranslate（SDK 负责 TC3 签名；调度由 Bottleneck 完成）
	const translateOne = async (options: {
		text: string;
		source: string;
		target: string;
	}): Promise<string> => {
		const { text, source, target } = options;
		const sourceText = text.length > MAX_SOURCE_CHARS ? text.slice(0, MAX_SOURCE_CHARS) : text;

		// 官方精简包未导出 TextTranslate 方法封装，用 AbstractClient.request 直调 Action
		const data = (await client.request("TextTranslate", {
			SourceText: sourceText,
			Source: source,
			Target: target,
			ProjectId: projectId,
		})) as TextTranslateResult;

		if (typeof data.TargetText !== "string") {
			throw new Error(
				`腾讯翻译响应缺少 TargetText${data.RequestId ? ` (RequestId=${data.RequestId})` : ""}`,
			);
		}
		return data.TargetText;
	};

	return {
		async translateTexts({
			texts,
			sourceLang = "EN",
			targetLang = "ZH",
		}: TranslateTextsOptions): Promise<TranslateTextsResult> {
			if (texts.length === 0) {
				return { texts: [] };
			}

			const source = toTmtLang(sourceLang);
			const target = toTmtLang(targetLang);

			// 全部丢进 limiter 排队；空串直接回传，不占 QPS
			const translated = await Promise.all(
				texts.map((text) => {
					if (!text.trim()) {
						return Promise.resolve(text);
					}
					return limiter.schedule(() => translateOne({ text, source, target }));
				}),
			);

			return { texts: translated };
		},
	};
};
