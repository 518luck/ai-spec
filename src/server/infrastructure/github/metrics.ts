// # GitHub API 请求监控：统计实际发往 api.github.com 的请求量与配额水位
// > 所有 api.github.com 请求都经过此模块计数；raw.githubusercontent.com 的 CDN 请求不计入（不消耗配额）
// > 用真实数据驱动"是否需要多 PAT 轮换"的决策，避免盲改

// 单个状态码分组的计数（key 为字符串化状态码，'other' 兜底未分类的）
type StatusBucket = {
	"200": number;
	"304": number;
	"404": number;
	"403": number;
	"429": number;
	other: number;
};

// 按 GitHub API endpoint 分组的计数
type EndpointBucket = {
	commits: number; // /repos/:owner/:repo/commits（查 HEAD sha）
	repos: number; // /repos/:owner/:repo（仓库元数据）
	"git-trees": number; // /repos/:owner/:repo/git/trees（文件树）
	search: number; // /search/...（Code Search，未来扩源用）
	other: number;
};

// 监控快照结构
export type GithubMetrics = {
	// 本次 worker 进程生命周期内的请求总数
	totalRequests: number;
	// 按状态码分组（304 不消耗配额，单独看才能算真实消耗）
	byStatus: StatusBucket;
	// 按请求的 endpoint 分组
	byEndpoint: EndpointBucket;
	// 真实消耗配额的请求数 = 总数 - 304 数（304 不消耗）
	quotaConsumed: number;
	// 观察到的最低剩余配额（从响应头 x-ratelimit-remaining 读）
	minRemaining: number | null;
	// 配额重置时间（从响应头 x-ratelimit-reset 读，Unix 秒）
	resetAt: number | null;
	// 计数起点（worker 启动或上次 reset 的时间）
	startedAt: Date;
};

// > 进程级单例计数器；worker 单并发消费，无需并发保护
let metrics: GithubMetrics = createEmptyMetrics();

// 创建空的 metrics 快照
function createEmptyMetrics(): GithubMetrics {
	return {
		totalRequests: 0,
		byStatus: { "200": 0, "304": 0, "404": 0, "403": 0, "429": 0, other: 0 },
		byEndpoint: { commits: 0, repos: 0, "git-trees": 0, search: 0, other: 0 },
		quotaConsumed: 0,
		minRemaining: null,
		resetAt: null,
		startedAt: new Date(),
	};
}

// 从 URL 解析出 endpoint 分组 key
const parseEndpoint = (url: string): keyof EndpointBucket => {
	if (url.includes("/commits")) return "commits";
	if (url.includes("/git/trees")) return "git-trees";
	if (url.includes("/search/")) return "search";
	// /repos/:owner/:repo 的元数据查询（不含上面的子路径）
	if (/\/repos\/[^/]+\/[^/]+(?:\?|$)/.test(url)) return "repos";
	return "other";
};

// 状态码分桶
const bucketStatus = (status: number): keyof StatusBucket => {
	switch (status) {
		case 200:
			return "200";
		case 304:
			return "304";
		case 404:
			return "404";
		case 403:
			return "403";
		case 429:
			return "429";
		default:
			return "other";
	}
};

type RecordOptions = {
	status: number;
	url: string;
	// 响应头 x-ratelimit-remaining（字符串或 null）
	remaining?: string | null;
	// 响应头 x-ratelimit-reset（字符串或 null，Unix 秒）
	reset?: string | null;
};

// > 记录一次 GitHub API 请求：在 githubFetch 拿到响应后调用
export const recordGithubRequest = ({ status, url, remaining, reset }: RecordOptions): void => {
	metrics.totalRequests += 1;

	const statusKey = bucketStatus(status);
	metrics.byStatus[statusKey] += 1;

	const endpointKey = parseEndpoint(url);
	metrics.byEndpoint[endpointKey] += 1;

	// 304 不消耗配额，其余都算真实消耗
	if (status !== 304) {
		metrics.quotaConsumed += 1;
	}

	// 更新配额水位（只在有有效数字时更新）
	const remainingNum = remaining ? Number.parseInt(remaining, 10) : Number.NaN;
	if (!Number.isNaN(remainingNum)) {
		metrics.minRemaining =
			metrics.minRemaining === null ? remainingNum : Math.min(metrics.minRemaining, remainingNum);
	}

	const resetNum = reset ? Number.parseInt(reset, 10) : Number.NaN;
	if (!Number.isNaN(resetNum)) {
		metrics.resetAt = resetNum;
	}
};

// 拿当前 metrics 快照（返回副本，调用方可安全序列化）
export const getGithubMetrics = (): Readonly<GithubMetrics> => ({
	...metrics,
	byStatus: { ...metrics.byStatus },
	byEndpoint: { ...metrics.byEndpoint },
});

// 重置计数器（一般 worker 重启时自然重置，无需手动调）
export const resetGithubMetrics = (): void => {
	metrics = createEmptyMetrics();
};

// 返回精简版快照（适合塞进 console.error 的 context 对象，避免日志过长）
export const getGithubMetricsSnapshot = (): Record<string, unknown> => {
	const m = metrics;
	return {
		total: m.totalRequests,
		consumed: m.quotaConsumed,
		hit304: m.byStatus["304"],
		minRemaining: m.minRemaining,
	};
};

// 把 metrics 格式化成可读的日志字符串
export const formatGithubMetrics = (m: Readonly<GithubMetrics> = getGithubMetrics()): string => {
	const resetStr = m.resetAt ? new Date(m.resetAt * 1000).toISOString() : "未知";
	return [
		`GitHub API 统计（自 ${m.startedAt.toISOString()}）`,
		`  总请求: ${m.totalRequests} | 真实消耗配额: ${m.quotaConsumed}（304 命中 ${m.byStatus["304"]} 次未计入）`,
		`  状态码: 200=${m.byStatus["200"]} 304=${m.byStatus["304"]} 404=${m.byStatus["404"]} 403=${m.byStatus["403"]} 429=${m.byStatus["429"]} other=${m.byStatus.other}`,
		`  endpoint: commits=${m.byEndpoint.commits} repos=${m.byEndpoint.repos} git-trees=${m.byEndpoint["git-trees"]} search=${m.byEndpoint.search} other=${m.byEndpoint.other}`,
		`  配额水位: 最低剩余 ${m.minRemaining ?? "未知"} | 重置于 ${resetStr}`,
	].join("\n");
};
