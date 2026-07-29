# 状态管理

> 权威源：`src/AGENTS.md`。按作用范围选方案，不过度抽象。

## 选型优先级

| 场景 | 方案 |
| --- | --- |
| 只属于当前组件 | `useState` / 组件局部状态 |
| 父子组件少量直接传递 | props |
| 多个兄弟组件读写同一份状态 | Context |
| 跨页面 / 全局业务状态，需持久化 | zustand（如 `src/features/markdown-editor/model/editor-store.ts` 用 `persist`）|
| 服务端数据 | **数据请求层（SWR）**，不放入 Context / zustand |

判断关键：状态的**作用范围**，而非为了统一而抽象。局部状态留在组件内，页面/功能流程级共享才上浮。

## 什么时候用 Context

- 同一份状态被多个兄弟组件读写。
- 状态不只属于某个组件，而属于整个页面或功能流程。
- 不用 Context 会出现明显 props drilling。
- 状态含多个相关字段和操作方法（表单步骤、登录方式、当前选中项、展开状态等）。

Context 放在当前 slice 的 `model/` 目录，如 `src/pages/xxx/model/xxx-context.tsx` 或 `src/features/xxx/model/xxx-context.tsx`。

## 什么时候不用 Context

- 状态只被一个组件使用。
- 只是父组件传给一两个直接子组件。
- 纯 UI 临时状态（按钮 loading、弹窗开关）。
- 可简单通过 props 表达且不会层层传递。
- 服务端数据（应走 SWR）。

## Context 编写要求

Context 文件必须包含：明确 `ContextType` 类型 + Provider 组件 + `useXxxContext` 自定义 Hook。

```tsx
const XxxContext = createContext<XxxContextType | null>(null);

// 提供当前功能流程内共享的页面状态
export function XxxProvider({ children }: PropsWithChildren): JSX.Element { /* ... */ }

// 读取当前功能流程内的共享页面状态
export const useXxxContext = (): XxxContextType => {
  const context = useContext(XxxContext);
  if (context === null) {
    throw new Error("useXxxContext 必须在 XxxProvider 内部使用。");
  }
  return context;
};
```

- `useXxxContext` 内必须检查是否在 Provider 内使用，缺失时抛明确错误。
- 不直接导出原始 Context，外部统一经 `useXxxContext` 访问。
- Provider 只包裹真正需要共享状态的页面区域，不无意义扩大范围。

真实范例：`src/pages/spec/auth/login/model/login-context.tsx`、`src/widgets/dual-sidebar/model/dual-sidebar-context.tsx`、`src/pages/spec/personal/prompt/records/model/records-mutate-context.tsx`。

## zustand

跨页面/全局、需持久化的业务状态用 zustand（带 `persist` 中间件）。范例：`src/features/markdown-editor/model/editor-store.ts`。不要把请求层服务端数据塞进 zustand。
