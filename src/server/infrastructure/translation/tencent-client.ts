import { tmt } from "tencentcloud-sdk-nodejs-tmt";

import type { TranslateTextsOptions, TranslateTextsResult, TranslationProvider } from "./types";

// # 腾讯云机器翻译：官方 tmt SDK 负责签名与请求，本文件只做批处理与端口适配

const TmtClient = tmt.v20180321.Client;

// TextTranslate 默认约 5 次/秒；批内并发略低于上限
const DEFAULT_CONCURRENCY = 4;
// 单次 SourceText 上限 6000 字符
const MAX_SOURCE_CHARS = 6000;

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

// 限流并发执行（保持结果顺序）
const mapWithConcurrency = async <T, R>(
	items: T[],
	concurrency: number,
	mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
	if (items.length === 0) {
		return [];
	}
	const results = new Array<R>(items.length);
	let nextIndex = 0;

	const worker = async (): Promise<void> => {
		while (nextIndex < items.length) {
			const current = nextIndex;
			nextIndex += 1;
			const item = items[current];
			if (item === undefined) {
				continue;
			}
			results[current] = await mapper(item, current);
		}
	};

	const poolSize = Math.min(concurrency, items.length);
	await Promise.all(Array.from({ length: poolSize }, () => worker()));
	return results;
};

// 腾讯 TMT provider：缺密钥直接抛错，避免静默不翻却无感知
export const createTencentProvider = (): TranslationProvider => {
	const secretId = process.env.TENCENT_SECRET_ID?.trim() ?? ""; // 云 API 密钥 ID
	const secretKey = process.env.TENCENT_SECRET_KEY?.trim() ?? ""; // 云 API 密钥 Key
	const region = process.env.TENCENT_TMT_REGION?.trim() || "ap-guangzhou"; // 调用地域，默认广州
	const projectId = Number(process.env.TENCENT_TMT_PROJECT_ID ?? "0") || 0; // 腾讯云项目 ID，默认 0
	const concurrency = Math.max(
		1,
		Number(process.env.TENCENT_TMT_CONCURRENCY) || DEFAULT_CONCURRENCY, // 批内并发，默认 4
	);

	// ! 密钥必须成对配置；缺了立刻失败，方便在 worker 日志里发现
	if (!secretId || !secretKey) {
		throw new Error(
			"未配置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY，无法调用腾讯云机器翻译（请写入 .env 后重启 worker）",
		);
	}

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

	// 单条 TextTranslate（SDK 负责 TC3 签名）
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

			const translated = await mapWithConcurrency(texts, concurrency, async (text) => {
				if (!text.trim()) {
					return text;
				}
				return translateOne({ text, source, target });
			});

			return { texts: translated };
		},
	};
};
