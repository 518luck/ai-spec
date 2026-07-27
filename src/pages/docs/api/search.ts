import { createTokenizer } from "@orama/tokenizers/mandarin";
import { createFromSource } from "fumadocs-core/search/server";
import { source } from "../model/source";

// # 文档搜索服务端:Orama 默认分词对中文失效,必须配 mandarin 分词器并关闭模糊容差
export const docsSearch = createFromSource(source, {
	components: { tokenizer: createTokenizer() },
	search: { threshold: 0, tolerance: 0 },
});
