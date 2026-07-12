import type { JSX } from "react";

import prisma from "@/shared/db";
import { auth } from "@/shared/lib/auth/auth";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { EmptyState } from "@/widgets/empty-state";
import { TitlePageShell } from "@/widgets/page-shell";
import { PAGE_SIZE } from "../config/constants";
import { CreateKeyButton } from "./create-key-button";
import { KeysTable } from "./keys-table";

// # API 密钥总览页面（服务端组件，按页查询当前登录用户的令牌）
export async function KeysPage({ page }: { page: number }): Promise<JSX.Element> {
	const session = await auth();
	const userId = session?.user.id;

	if (!userId) {
		return (
			<TitlePageShell title="API 密钥">
				<EmptyState icon={Icons.key} description="登录后即可管理你的 API 密钥" />
			</TitlePageShell>
		);
	}

	// findMany 取当前页切片，count 取总数用于分页栏；两者无依赖，并行查询
	const [tokens, total] = await Promise.all([
		prisma.token.findMany({
			where: { user_id: userId },
			orderBy: { created_at: "desc" },
			skip: page * PAGE_SIZE,
			take: PAGE_SIZE,
			select: {
				id: true,
				name: true,
				description: true,
				partial_key: true,
				// scopes 为空格分隔的权限串，split 后交给 scopesToName 反查展示标签
				scopes: true,
				// 过期时间，null 表示永不过期；列表展示剩余时间 + 编辑弹窗回填都用
				expires: true,
			},
		}),
		prisma.token.count({ where: { user_id: userId } }),
	]);

	return (
		<TitlePageShell title={<KeysPageHeader />} fill>
			{total === 0 ? (
				<EmptyState icon={Icons.key} description="还没有 API 密钥，创建一个开始接入吧" />
			) : (
				// 表格 + 分页交由客户端组件渲染（翻页按钮需要导航交互）
				<KeysTable tokens={tokens} page={page} total={total} />
			)}
		</TitlePageShell>
	);
}

// 标题区：主标题 + 说明问号 + 右上角创建按钮
function KeysPageHeader(): JSX.Element {
	return (
		<div className="flex w-full items-center justify-between">
			<div className="flex items-center gap-1.5">
				<h1 className="font-semibold text-lg">API 密钥</h1>
				<HelpTooltip alignWithText content="生成一枚用于程序化接入的密钥，仅归属于你的个人工作空间，创建后请妥善保存。" />
			</div>
			<CreateKeyButton />
		</div>
	);
}
