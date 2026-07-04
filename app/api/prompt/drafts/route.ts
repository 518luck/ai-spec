import { NextResponse } from "next/server";

import { withSession } from "@/shared/lib/ohs/remote/adapter/with-session";

// 创建提示词草稿：鉴权入口已就绪，业务逻辑待实现
export const POST = withSession(async () => {
  // TODO: 校验入参（name? / description? / content / images?），以 session.user.id 为 owner 写入 PromptDraft
  return NextResponse.json({ message: "创建草稿接口尚未实现" }, { status: 501 });
});
