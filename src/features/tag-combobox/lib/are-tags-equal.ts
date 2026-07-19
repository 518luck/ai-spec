// # 标签集合相等判断：按 id 比较两组标签是否一致（顺序无关）

import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";

/**
 * 比较两组标签是否相等（按 id 集合，顺序无关）。
 *
 * 用于"用户改了标签没"这类判断——拖拽排序、勾选/取消、增删都会被检出，
 * 但仅顺序不同（id 集合相同）视为相等。
 *
 * @example
 * areTagsEqual([], [])                                    // true
 * areTagsEqual([{id:"a"}], [{id:"a"}])                    // true
 * areTagsEqual([{id:"a"},{id:"b"}], [{id:"b"},{id:"a"}])  // true（顺序无关）
 * areTagsEqual([{id:"a"}], [{id:"b"}])                    // false
 * areTagsEqual([{id:"a"}], [])                            // false
 */
export const areTagsEqual = (a: TagOptionVo[], b: TagOptionVo[]): boolean =>
	a.length === b.length && a.every((t) => b.some((o) => o.id === t.id));
