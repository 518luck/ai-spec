import { DocsSlugPage, generateDocsMetadata, generateDocsStaticParams } from "@/pages/docs";

// # 文档正文页(薄层路由,渲染、静态参数与元数据均委托 slice)
export default DocsSlugPage;
export const generateStaticParams = generateDocsStaticParams;
export const generateMetadata = generateDocsMetadata;
