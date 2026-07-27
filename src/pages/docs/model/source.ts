import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";

// # 文档站内容源:把 .source 生成物装配成 page tree 与页面查询接口
export const source = loader({
	baseUrl: "/docs",
	source: docs.toFumadocsSource(),
});
