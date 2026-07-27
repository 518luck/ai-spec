// # 文档站 slice 公有 API:app/docs 与 app/api/search 薄层从这里消费
export { docsSearch } from "./api/search";
export { DocsSiteLayout } from "./ui/layout";
export { DocsSlugPage, generateDocsMetadata, generateDocsStaticParams } from "./ui/page";
