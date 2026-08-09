import matter from "gray-matter";
// GitHub 响应含大量未声明字段，共享入口的 z 在开发环境是 strictObject 会误报，这里用原生宽松 object
import * as z from "zod/v4";
import { AiSpecError } from "@/server/errors/http-error";
import {
	getGithubMetricsSnapshot,
	recordGithubRequest,
} from "@/server/infrastructure/github/metrics";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

// # GitHub Skill 抓取：解析仓库链接 → 定位所有 SKILL.md → 拉取文件仅解析 frontmatter
//
// GitHub 是唯一数据源，本模块只读不写库；按 URL 导入接口与定时同步任务共用这一套函数
// ! 只取 name/description/license，不保留 SKILL.md 全文（广场不做全文转载）

// 单次导入最多处理的 SKILL.md 数量（防止超大 monorepo 拖垮请求）
const MAX_SKILLS_PER_IMPORT = 100;

// 拉取 raw 文件的并发批大小
const FETCH_BATCH_SIZE = 10;

// GitHub 链接解析结果：仓库定位 + 可选的分支与子目录约束
type GitHubSource = {
	owner: string;
	repo: string;
	ref?: string;
	pathPrefix?: string;
};

// 单个解析成功的 skill（license 已完成 frontmatter → 仓库 license 的回落；不携带全文）
export type ParsedSkill = {
	name: string;
	description: string;
	license: string | null;
	sourcePath: string;
};

// 仓库级元数据 + 其中解析出的全部 skill
export type RepoSkills = {
	sourceRepo: string;
	authorName: string;
	authorType: string; // "Organization" 或 "User"
	authorAvatarUrl: string;
	authorHtmlUrl: string;
	stars: number;
	commitSha: string;
	ref: string;
	// 链接里显式指定的分支（null=默认分支）与子目录前缀，供货源清单记录同步范围
	requestedRef: string | null;
	pathPrefix: string | null;
	skills: ParsedSkill[];
};

// @ GitHub API 响应校验（只声明用到的字段，其余由宽松 object 丢弃）
const repoMetaSchema = z.object({
	full_name: z.string(),
	default_branch: z.string(),
	stargazers_count: z.number(),
	owner: z.object({
		login: z.string(),
		type: z.string(), // "Organization" 或 "User"
		avatar_url: z.string(),
		html_url: z.string(),
	}),
	license: z.object({ spdx_id: z.string().nullable() }).nullable(),
});

const repoTreeSchema = z.object({
	sha: z.string(),
	truncated: z.boolean(),
	tree: z.array(z.object({ path: z.string(), type: z.string() })),
});

// SKILL.md frontmatter：规范要求 name/description，宽松解析后再逐条判断
const frontmatterSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	license: z.string().optional(),
});

// @ 对外入口
// > 给定 GitHub 链接，返回仓库元数据与其中所有解析成功的 skill；找不到 SKILL.md 时抛 NOT_FOUND
export const fetchRepoSkills = async (url: string): Promise<RepoSkills> => {
	const { owner, repo, ref, pathPrefix } = parseGitHubUrl(url);

	// ① 仓库元数据：默认分支、star 数、license
	const meta = repoMetaSchema.parse(
		await fetchGitHubJson(`https://api.github.com/repos/${owner}/${repo}`),
	);
	const targetRef = ref ?? meta.default_branch;
	const repoLicense = normalizeLicense(meta.license?.spdx_id);
	const authorType = meta.owner.type === "Organization" ? "Organization" : "User";

	// ② 完整文件树一次拿全，过滤出（限定子目录下的）所有 SKILL.md
	const tree = repoTreeSchema.parse(
		await fetchGitHubJson(
			`https://api.github.com/repos/${owner}/${repo}/git/trees/${targetRef}?recursive=1`,
		),
	);
	const skillPaths = tree.tree
		.filter((entry) => entry.type === "blob" && isSkillFile(entry.path))
		.filter((entry) => !pathPrefix || entry.path.startsWith(`${pathPrefix}/`))
		.map((entry) => entry.path)
		.slice(0, MAX_SKILLS_PER_IMPORT);

	if (skillPaths.length === 0) {
		throw new AiSpecError({
			code: ErrorCode.NOT_FOUND,
			message: "该仓库（或指定目录）中未找到 SKILL.md",
		});
	}

	// ③ 分批并发拉取文件并只解析 frontmatter，单个文件失败跳过不影响整批
	const skills: ParsedSkill[] = [];
	for (let i = 0; i < skillPaths.length; i += FETCH_BATCH_SIZE) {
		const batch = skillPaths.slice(i, i + FETCH_BATCH_SIZE);
		const results = await Promise.all(
			batch.map((path) => fetchSkillFile({ owner, repo, ref: targetRef, path, repoLicense })),
		);
		skills.push(...results.filter((skill) => skill !== null));
	}

	if (skills.length === 0) {
		throw new AiSpecError({
			code: ErrorCode.NOT_FOUND,
			message: "找到了 SKILL.md 但均不符合 Agent Skills 规范（缺少 frontmatter description）",
		});
	}

	return {
		sourceRepo: meta.full_name,
		authorName: meta.owner.login,
		authorType,
		authorAvatarUrl: meta.owner.avatar_url,
		authorHtmlUrl: meta.owner.html_url,
		stars: meta.stargazers_count,
		commitSha: tree.sha,
		ref: targetRef,
		requestedRef: ref ?? null,
		pathPrefix: pathPrefix ?? null,
		skills,
	};
};

// > 把用户粘贴的 GitHub 链接解析为 owner/repo（+ tree/blob 链接携带的分支与子目录）
export const parseGitHubUrl = (url: string): GitHubSource => {
	const { pathname } = new URL(url);
	const [owner, rawRepo, kind, ref, ...rest] = pathname.split("/").filter(Boolean);
	if (!owner || !rawRepo) {
		throw new AiSpecError({
			code: ErrorCode.VALIDATION_ERROR,
			message: "链接缺少仓库路径，应形如 github.com/owner/repo",
		});
	}
	const repo = rawRepo.replace(/\.git$/, "");

	// tree 链接限定子目录；blob 链接指向具体文件，取其所在目录
	if ((kind === "tree" || kind === "blob") && ref) {
		const path = rest.join("/");
		const pathPrefix = kind === "blob" ? path.split("/").slice(0, -1).join("/") : path;
		return { owner, repo, ref, pathPrefix: pathPrefix || undefined };
	}
	return { owner, repo };
};

// 仓库 HEAD sha 查询结果：notModified=true 表示 etag 命中 304（自上次以来无任何提交）
// canonicalRepo 是 GitHub 规范全名（从响应提取），与请求名不一致说明仓库改名/大小写不同
export type RepoHeadSha =
	| { notModified: true }
	| { notModified: false; sha: string; etag: string | null; canonicalRepo: string | null };

type FetchRepoHeadShaOptions = {
	repo: string;
	// 查询的分支/ref；省略为默认分支
	ref?: string | null;
	etag?: string | null;
};

// 从 GitHub 限流响应头算恢复时刻（Unix ms）；优先 Retry-After，其次 x-ratelimit-reset，兜底 65min
const parseGithubResumeAt = (headers: Headers): number => {
	const now = Date.now();
	// 1) Retry-After（官方首选）：相对秒数
	const retryAfter = headers.get("retry-after");
	if (retryAfter) {
		const secs = Number.parseInt(retryAfter, 10);
		if (!Number.isNaN(secs)) return now + secs * 1000;
	}
	// 2) x-ratelimit-reset（primary limit）：绝对 Unix 秒
	const reset = headers.get("x-ratelimit-reset");
	if (reset) {
		const secs = Number.parseInt(reset, 10);
		if (!Number.isNaN(secs)) return secs * 1000;
	}
	// 3) 兜底：65 分钟（GitHub 按小时滚动窗口，65 分钟必进新窗口）
	return now + 65 * 60 * 1000;
};

// > 查仓库指定/默认分支最新 commit sha（1 次请求）；带 etag 命中 304 时不消耗 API 限额
export const fetchRepoHeadSha = async ({
	repo,
	ref,
	etag,
}: FetchRepoHeadShaOptions): Promise<RepoHeadSha> => {
	const refParam = ref ? `&sha=${encodeURIComponent(ref)}` : "";
	const res = await githubFetch(
		`https://api.github.com/repos/${repo}/commits?per_page=1${refParam}`,
		{
			headers: { ...githubHeaders(), ...(etag && { "If-None-Match": etag }) },
		},
	);
	if (res.status === 304) {
		return { notModified: true };
	}
	// ! 409 = 空仓库（GitHub 对空仓库的 /commits 不返回空数组），与 404 同样按"无货"处理
	if (res.status === 404 || res.status === 409) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "仓库不存在、为空或不是公开仓库" });
	}
	if (res.status === 403 || res.status === 429) {
		console.error("GitHub API 触发限流", {
			url: `repos/${repo}/commits`,
			metrics: getGithubMetricsSnapshot(),
		});
		throw new AiSpecError({
			code: ErrorCode.RATE_LIMITED,
			message: "GitHub API 触发限流",
			context: { retryAfter: parseGithubResumeAt(res.headers) },
		});
	}
	if (!res.ok) {
		throw new AiSpecError({
			code: ErrorCode.INTERNAL_ERROR,
			message: `GitHub API 请求失败（${res.status}）`,
		});
	}
	const [head] = commitListSchema.parse(await res.json());
	if (!head) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "该分支没有任何提交" });
	}
	return {
		notModified: false,
		sha: head.sha,
		etag: res.headers.get("etag"),
		canonicalRepo: extractRepoFromCommitUrl(head.html_url),
	};
};

// > 解析 awesome 列表仓库的 README，抽取其中链接到的所有 GitHub 仓库（去重、排除自身与非仓库路径）
export const fetchAwesomeRepos = async (listRepo: string): Promise<string[]> => {
	// ! 用 GitHub REST API 的 readme 端点获取内容（走 api.github.com），
	// ! 不用 raw.githubusercontent.com（国内服务器常被墙导致 fetch failed）。
	// ! 返回体 content 字段是 base64 编码的 README 原文。
	const readmeData = (await fetchGitHubJson(`https://api.github.com/repos/${listRepo}/readme`)) as {
		content?: string;
	};
	if (!readmeData.content) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "awesome 列表仓库没有 README" });
	}
	const readme = Buffer.from(readmeData.content, "base64").toString("utf-8");

	const matches = readme.match(/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/g) ?? [];
	// 大小写不敏感去重（GitHub 仓库名查找不区分大小写），保留首次出现的写法
	const repos = new Map<string, string>();
	for (const match of matches) {
		const repo = match.replace("github.com/", "").replace(/\.git$/, "");
		const [owner] = repo.split("/");
		if (!owner || NON_REPO_OWNERS.has(owner.toLowerCase())) continue;
		if (repo.toLowerCase() === listRepo.toLowerCase()) continue;
		if (!repos.has(repo.toLowerCase())) repos.set(repo.toLowerCase(), repo);
	}
	return [...repos.values()];
};

// @ 内部辅助
// 提交列表响应：sha + html_url（后者用于提取仓库规范全名，识别改名/大小写差异）
const commitListSchema = z.array(z.object({ sha: z.string(), html_url: z.string() }));

// 从 commit 的 html_url（github.com/{owner}/{repo}/commit/{sha}）提取仓库规范全名
const extractRepoFromCommitUrl = (htmlUrl: string): string | null => {
	const match = htmlUrl.match(/github\.com\/([^/]+\/[^/]+)\/commit\//);
	return match?.[1] ?? null;
};

// github.com 下不是"用户名"的保留路径段，解析 README 链接时排除
const NON_REPO_OWNERS = new Set([
	"topics",
	"search",
	"orgs",
	"sponsors",
	"features",
	"site",
	"about",
	"settings",
	"marketplace",
	"apps",
	"collections",
	"trending",
	"login",
	"join",
	"contact",
	"pricing",
	"enterprise",
	"events",
	"blog",
]);

// 判断路径是否为 skill 定义文件（规范固定文件名 SKILL.md，容忍大小写差异）
const isSkillFile = (path: string): boolean =>
	(path.split("/").at(-1) ?? "").toLowerCase() === "skill.md";

// GitHub 未识别出 license 时返回 "NOASSERTION"，与缺失统一归一为 null
const normalizeLicense = (spdxId: string | null | undefined): string | null =>
	spdxId && spdxId !== "NOASSERTION" ? spdxId : null;

// 请求头：配置 GITHUB_TOKEN 时携带，限额从 60 次/时提升到 5000 次/时
const githubHeaders = (): HeadersInit => {
	const token = process.env.GITHUB_TOKEN;
	return {
		Accept: "application/vnd.github+json",
		...(token && { Authorization: `Bearer ${token}` }),
	};
};

// > 统一 GitHub API 请求入口：在 fetch 外包一层埋点，把请求量/状态码/配额水位记进 metrics
// 所有 api.github.com 请求都走这里；raw.githubusercontent.com（拉 SKILL.md 解析 frontmatter）不计入（不消耗配额）
const githubFetch = async (url: string, init?: RequestInit): Promise<Response> => {
	const res = await fetch(url, init);
	recordGithubRequest({
		status: res.status,
		url,
		remaining: res.headers.get("x-ratelimit-remaining"),
		reset: res.headers.get("x-ratelimit-reset"),
	});
	return res;
};

// 调 GitHub REST API，把常见失败翻译成业务错误
const fetchGitHubJson = async (url: string): Promise<unknown> => {
	const res = await githubFetch(url, { headers: githubHeaders() });
	if (res.status === 404) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "仓库不存在或不是公开仓库" });
	}
	if (res.status === 403 || res.status === 429) {
		// > 触发限流时打日志带上 metrics 快照，便于判断是否需要多 PAT 轮换
		console.error("GitHub API 触发限流", {
			url,
			metrics: getGithubMetricsSnapshot(),
		});
		throw new AiSpecError({
			code: ErrorCode.RATE_LIMITED,
			message: "GitHub API 触发限流，请稍后再试（服务端配置 GITHUB_TOKEN 可提升限额）",
			context: { retryAfter: parseGithubResumeAt(res.headers) },
		});
	}
	if (!res.ok) {
		throw new AiSpecError({
			code: ErrorCode.INTERNAL_ERROR,
			message: `GitHub API 请求失败（${res.status}）`,
		});
	}
	return res.json();
};

// 拉取单个 SKILL.md 并解析 frontmatter；不合规范或拉取失败返回 null 跳过（全文用完即弃）
const fetchSkillFile = async ({
	owner,
	repo,
	ref,
	path,
	repoLicense,
}: {
	owner: string;
	repo: string;
	ref: string;
	path: string;
	repoLicense: string | null;
}): Promise<ParsedSkill | null> => {
	// ! 用 GitHub REST API contents 端点（走 api.github.com），
	// ! 不用 raw.githubusercontent.com（国内服务器常被墙）。
	// ! 单文件失败（404/限流等）静默跳过，不影响整体扫描。
	let fileData: { content?: string };
	try {
		fileData = (await fetchGitHubJson(
			`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
		)) as { content?: string };
	} catch {
		return null;
	}
	if (!fileData.content) {
		return null;
	}
	const text = Buffer.from(fileData.content, "base64").toString("utf-8");

	// gray-matter 对非法 YAML 会抛错，视为不合规范跳过
	let data: unknown;
	try {
		data = matter(text).data;
	} catch {
		return null;
	}
	const parsed = frontmatterSchema.safeParse(data);
	if (!parsed.success) {
		return null;
	}

	// 规范要求 description 必填，缺失视为非标准 skill；name 缺省回落 SKILL.md 所在目录名
	const { name, description, license } = parsed.data;
	if (!description) {
		return null;
	}
	const dirName = path.split("/").at(-2) ?? repo;

	return {
		name: name || dirName,
		description,
		license: normalizeLicense(license) ?? repoLicense,
		sourcePath: path,
	};
};
