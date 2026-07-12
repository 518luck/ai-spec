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

新增 hook 时在 `index.ts` 登记 re-export，行末加简短注释标明作用：`export { useMounted } from "./use-mounted"; // 组件是否已挂载，SSR 安全，挂载后驱动渲染`

## 优先用 react-use，不自实现

通用 hooks（防抖、节流、localStorage、事件监听、元素尺寸等）**优先从 `react-use` 导入**，不要在本目录重复实现。使用前查阅 [react-use 文档](https://github.com/streamich/react-use) 确认 hook 名称和行为。

只有 react-use **没有**对应 hook，或有同类但 **API 或行为不满足需求**（返回类型、SSR 兼容性、触发渲染机制不同）时，才在本目录自实现。

现有 hook 清单见 `index.ts`，每行 export 末尾的注释标明作用。
