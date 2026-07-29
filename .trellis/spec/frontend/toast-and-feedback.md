# Toast 与全局反馈

> 权威源：`src/AGENTS.md`。

## Toast

- 统一从 **`@/features/toast`** 导入 `toast` 和 `Toaster`：

```ts
import { toast } from "@/features/toast";
toast.success("保存成功");
toast.error("出错了");
```

- **业务代码禁止直接从 `sonner` 导入** `toast`/`Toaster`。
  - 例外：`src/features/toast/` 内部封装层（`model/toast.tsx`、`ui/toaster.tsx`）允许直接用 `sonner`；这是唯一合法的直接依赖点。
- `<Toaster />` 已挂载在根布局，业务无需重复挂载。
- 封装层为每条 toast 自动注入"复制"按钮等增强。

## 与 SWR 配合

- 全局 SWR `onError` 已自动 `toast.error` 并按 key 去重（见 `data-fetching.md`）。
- 因此业务组件通常**不再手动** `toast.error` 请求失败——除非是业务语义错误（非请求失败本身）。

## 反模式

- 从 `sonner` 直接 `import { toast }` 用于业务。
- 重复挂载 `<Toaster />`。
- 请求失败时在组件里再 `toast.error`（与全局 onError 重复）。
