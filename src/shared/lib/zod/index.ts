// # 项目统一 zod 入口：开发时 z.object 自动变 strict（多余字段报错），生产时保持默认（宽松丢弃）
// > 所有需要用 z 的地方都从这里导入：import { z } from "@/shared/lib/zod"
// > z.infer 等类型用法也正常工作（通过 namespace 合并声明）

import * as rawZ from "zod/v4";

// 开发环境用 strictObject（多余字段报错），生产环境用 object（宽松丢弃）
const object = process.env.NODE_ENV === "production" ? rawZ.object : rawZ.strictObject;

// 覆盖 object 方法，其余透传原始 zod
const z = { ...rawZ, object };

// 合并值和命名空间声明，让 z.infer<typeof schema> 等类型用法正常工作
export namespace z {
	export type infer<T extends rawZ.ZodType> = rawZ.infer<T>;
	export type output<T extends rawZ.ZodType> = rawZ.output<T>;
	export type input<T extends rawZ.ZodType> = rawZ.input<T>;
}

export { z };
