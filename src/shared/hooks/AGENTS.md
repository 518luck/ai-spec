# Hooks 规范

本目录存放项目自实现的 React hooks。继承上级 `AGENTS.md`，仅记录本目录的额外规则。

## Barrel File（唯一出口）

`index.ts` 是本目录的唯一对外出口。**所有 hook——自实现和 react-use 转发——都从这里统一导入**，禁止直接引用具体文件或 `react-use` 包：

```ts
// ✅ 正确：从 barrel 统一导入
import { useMounted, useLocalStorage } from "@/shared/hooks";

// ❌ 禁止：直接引用具体文件
import { useMounted } from "@/shared/hooks/use-mounted";

// ❌ 禁止：直接引用 react-use 包
import { useLocalStorage } from "react-use";
```

新增自实现 hook 或引入 react-use 新 hook 时，在 `index.ts` 登记 re-export。

## 优先用 react-use，不自实现

通用 hooks（防抖、节流、localStorage、事件监听、元素尺寸等）**优先从 `react-use` 导入**，不要在本目录重复实现。使用前查阅 [react-use 文档](https://github.com/streamich/react-use) 确认 hook 名称和行为。

只有在以下情况才在本目录自实现：

- react-use **没有**对应 hook（如下方清单标注「无」的）。
- react-use 有同类 hook 但 **API 或行为不满足需求**（如返回类型、SSR 兼容性、触发渲染机制不同）。

## 现有 hooks 清单

| 文件 | hook | react-use 等价物 | 为何自实现 |
|------|------|-----------------|-----------|
| `use-mounted.ts` | `useMounted` | `useMountedState`（不可替代） | react-use 版用 ref 实现，不触发重渲染；本版用 `useSyncExternalStore`，挂载后驱动渲染 |
| `use-resize-observer.ts` | `useResizeObserver` | `useMeasure`（API 不同） | 接收 ref 参数返回 entry；react-use 版返回 `[ref, rect]` 元组需自管 ref |
| `use-scroll-progress.ts` | `useScrollProgress` | 无 | react-use `useScroll` 只返回像素值，不算 0~1 比例，也不联动 resize |
| `use-media-query.ts` | `useMediaQuery` | `useMediaQuery`（API 不同） | 返回 device 类型 + 多个布尔标志；react-use 版只返回单个布尔值 |
| `use-mobile.ts` | `useIsMobile` | 无 | 业务定制（768px 断点判断），基于 `useMediaQuery` 派生 |

## 新增 hook 流程

1. 先查 react-use 是否有同类 hook，确认 API 能否满足需求。
2. 确认需要自实现时，在本目录新建文件，文件名用 `use-xxx.ts`（kebab-case）。
3. 在上方清单登记，注明 react-use 等价物和自实现理由。

## 命名

- 文件名：`use-xxx.ts`（kebab-case）。
- 导出名：`useXxx`（camelCase），与文件名对应。
