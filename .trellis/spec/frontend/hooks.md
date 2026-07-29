# Hooks 规范

> 权威源：`src/shared/hooks/AGENTS.md`、`src/AGENTS.md`。自定义 Hook 用 `const` 箭头函数（`const useXxx = () => {}`）。

## Barrel 唯一出口

`src/shared/hooks/index.ts` 是本目录**唯一对外出口**。所有 hook 统一从这里导入，**禁止**直接引用具体文件，**禁止**业务代码直接 `import ... from "react-use"`：

```ts
// ✅
import { useMounted, useLocalStorage } from "@/shared/hooks";
// ❌ 直接引用文件
import { useMounted } from "@/shared/hooks/use-mounted";
// ❌ 直接引用 react-use
import { useLocalStorage } from "react-use";
```

新增 hook 在 `index.ts` 登记 re-export，行末加简短注释标明作用。

## 优先用 react-use，不自实现

通用 hooks（防抖、节流、事件监听、元素尺寸等）**优先用 react-use**，查阅 [react-use 文档](https://github.com/streamich/react-use) 确认 hook 名称和行为。只有 react-use 没有对应 hook、或同类但 API/行为不满足时才自实现。

`index.ts` 内以深层路径转发 react-use 以利 tree-shaking：

```ts
export { default as useDebounce } from "react-use/lib/useDebounce";
```

## 已知例外（必须用项目自实现版）

- **`useLocalStorage`**：不用 react-use 版（有 stale closure bug，[issue #2512](https://github.com/streamich/react-use/issues/2512)，函数式更新拿到旧值），用项目自实现版（`@/shared/hooks`，setter 支持函数式更新）。

现有 hook 清单见 `index.ts`，每行 export 末尾注释标明作用（如 `useHotkey`、`useInertialScroll` 等自实现 hook 也注明了为何不用 react-use 版）。

## 常用 hooks

`useSetState`（对象状态自动合并）、`useToggle`、`useDebounce`、`useThrottle`、`usePrevious`、`useClickAway`、`useScroll`、`useWindowSize`、`useAsync`/`useAsyncFn`、`useInView`（转发自 react-intersection-observer）。
