# 前端开发指南

## 适用范围

本指南适用于前端相关代码

注意：`shared/` 目录下的代码不一定都是前端代码，也可能包含后端共享逻辑。修改 `shared/` 下的文件时，先确认该文件的实际用途和调用方，不要默认按前端代码处理。

shared/lib 下面前后端混合
shared/db : 这个是脚本生成的代码,严禁修改

## 前端结构规范（FSD）

本项目前端业务代码位于 `src/`，按 Feature-Sliced Design 组织。根目录 `app/` 是 Next.js App Router 路由层，不是 FSD 的 `src/app`。除 `app/api/**` 外，根 `app/**` 应保持薄层，只放 `page.tsx`、`layout.tsx`、`metadata`、`loading.tsx`、`error.tsx` 等框架入口，并把业务实现委托给 `src/`。

### 放置规则

| 场景                               | 放置位置                  |
| ---------------------------------- | ------------------------- |
| 应用启动、全局 providers、全局样式 | `src/app/`                |
| 路由对应的完整页面内容             | `src/pages/<page>/`       |
| 可复用的大型页面区块               | `src/widgets/<widget>/`   |
| 用户可感知的业务动作               | `src/features/<feature>/` |
| 业务实体、实体展示、实体模型       | `src/entities/<entity>/`  |
| 与业务无关的通用能力               | `src/shared/<segment>/`   |

### 层职责

- **entities**：为复用而抽取，但复用的是**业务实体的建模**（类型、领域常量、实体展示），而非 UI。
- **widgets**：把一个完整用例的 UI 封装成可被 pages 复用的**复合 UI 块**；其复用性来自封装本身，不像 features / entities 那样以「复用」为首要目标。

### Slice 与 Segment

- `pages`、`widgets`、`features`、`entities` 下必须先建 slice，再建 segment，例如 `src/features/create-spec/ui/create-spec-form.tsx`。
- `src/app` 和 `src/shared` 不拆 slice，直接按 segment 组织。
- 常用 segment（按代码目的分组）：
  - `ui` — UI 显示相关：组件、样式、日期格式化等。
  - `model` — 数据模型：schema、类型、store、业务逻辑。
  - `api` — 请求与接口封装。
  - `lib` — 本 slice 复用的工具代码。
  - `config` — 配置、常量、feature flags。
- 不要新建 `components`、`hooks`、`types` 这类只描述技术形态的顶层 segment，优先归入 `ui`、`model`、`api`、`lib`。

### pages 层 slice 规范

pages 是页面级组合：每条路由对应一个 page slice。

#### 嵌套路由

pages 下的文件夹结构尽量与 URL 路由对应：URL 有共同前缀的路由，可以建一个父文件夹做归拢，父文件夹下每个路由再建独立 slice。

例：`/auth/login` 与 `/auth/register` 共享 `library` 前缀 → 建 `pages/auth/` 父文件夹归拢，下面分别建 `login/`、`register/` 两个 slice。

#### 命名

slice 内的文件不必重复 slice 名（文件夹路径已经标注过了）。常用 segment 下的文件命名约定如下：

- **`ui/`** — 单个页面组件用通用名 `page.tsx`，组件名保留语义，由 `index.ts` 导出（`pages/auth/login/ui/page.tsx` → `LoginPage`）。其余组件：有明确 UI 形态的直接用 UI 形态命名（`card.tsx`、`dialog.tsx`）；同一形态有多个时，用 UI 形态作前缀区分（`card-cluster.tsx`、`dialog-template-edit.tsx`）；无具体 UI 形态的按作用命名。
- **`model/`** — 数据获取 hook 用 `use-xxx.ts`；schema 用 `schema-xxx.ts`；类型用 `types.ts`；Context 用 `context-xxx.tsx`；纯函数/辅助用 `helpers-xxx.ts`。
- **`lib/`** — 工具/生成器按语义命名（`docx-builder.ts`、`format.ts`）。
- **`config/`** — 常量/枚举/静态配置，按内容命名（`constants.ts`、`menu-meta.ts`），内容简单时直接 `index.ts`。

动态段（`:parentId`）可用语义命名。

### 导入边界

Layer 只能向下依赖：

```txt
src/app
→ src/pages
→ src/widgets
→ src/features
→ src/entities
→ src/shared
```

- features 可以导入 entities 和 shared，不能导入 widgets、pages、src/app。
- entities 只能导入 shared。
- shared 不能导入任何业务 layer。
- 同一 layer 的不同 slice 默认不能互相导入。
- 如果需要组合多个同层 slice，应放到更高 layer，例如在 widgets 组合多个 features。

### 每个 slice 必须提供 index.ts 作为公有 API。

```typescript
// 正确
import { CreateSpecForm } from "@/features/create-spec";

// 禁止：跨 slice 深层导入
import { CreateSpecForm } from "@/features/create-spec/ui/create-spec-form";
```

- index.ts 只导出外部真正需要使用的组件、函数和类型。
- 禁止在 slice 公有 API 中使用 `export \*` 无差别导出。
- slice 内部文件互相引用时使用相对路径。
- 不要从本 slice 的 index.ts 再导入本 slice 内部成员。

### 禁止事项

- 禁止低层导入高层。
- 禁止同层不同 slice 互相导入。
- 禁止绕过公有 API 深层导入其他 slice 内部文件。
- 禁止把具体业务逻辑放进 shared。
- 禁止把只用一次的页面局部 UI 过早抽到 widgets 或 features。

## React 状态管理

编写组件状态时，优先按作用范围判断，不要为了统一而过度抽象。页面级或功能流程级共享状态可以抽 Context，局部状态应保持在组件内或通过 props 表达。

### 判断优先级

- 只属于当前组件的状态，使用 `useState` 或组件内局部状态。
- 父子组件之间少量直接传递的状态，使用 props。
- 多个兄弟组件需要读写同一份状态，使用 Context。
- 跨页面或全局业务状态，考虑全局状态管理或持久化方案。
- 服务端数据不要放入 Context，优先使用数据请求。

### 什么时候使用 Context

- 同一份状态需要被多个兄弟组件读写。
- 状态不只属于某一个组件，而是属于整个页面或功能流程。
- 如果不用 Context，会出现明显的 props drilling。
- 状态包含多个相关字段和操作方法，例如表单步骤、登录方式、当前选中项、展开状态等。
- 状态需要被页面下多个 UI 片段协同使用。

Context 应放在当前 slice 的 `model/` 目录下，例如 `src/pages/xxx/model/xxx-context.tsx` 或 `src/features/xxx/model/xxx-context.tsx`。

### 什么时候不要使用 Context

- 状态只被一个组件使用。
- 只是父组件传给一两个直接子组件。
- 状态是纯 UI 临时状态，例如一个按钮 loading、一个弹窗开关。
- 可以简单通过 props 表达，而且不会造成层层传递。
- 状态属于服务端数据，应优先使用请求层。

### Context 编写要求

- Context 文件应包含明确的 `ContextType` 类型、Provider 组件和 `useXxxContext` 自定义 Hook。
- `useXxxContext` 内必须检查是否在 Provider 内部使用，并在缺失 Provider 时抛出明确错误。
- 不要直接导出原始 Context，外部统一通过 `useXxxContext` 访问。
- Provider 只包裹真正需要共享状态的页面区域，不要无意义扩大范围。

```typescript
const XxxContext = createContext<XxxContextType | null>(null);

// 提供当前功能流程内共享的页面状态
export function XxxProvider({ children }: PropsWithChildren): JSX.Element {
  // ...
}

// 读取当前功能流程内的共享页面状态
export const useXxxContext = (): XxxContextType => {
  const context = useContext(XxxContext);

  if (context === null) {
    throw new Error("useXxxContext 必须在 XxxProvider 内部使用。");
  }

  return context;
};
```

## UI 组件

优先使用 shadcn 组件进行开发。

项目内的 shadcn 组件统一放在 `shared/ui` 目录下。使用组件前，先检查 `shared/ui` 中是否已有可复用实现。

如果 shadcn 官方提供了某个组件，但本地尚未安装，可以使用：

```bash
pnpm dlx shadcn@latest add [组件名]
```

使用 shadcn 组件时，如果不确定组件 API、组合方式或最佳实践，应调用 /shadcn 技能查看正确用法。

## 排版规范

统一使用 Tailwind 的 `text-*` 工具类，不要自行新增字号档位。

| 场景          | 字号               | 字重            |
| ------------- | ------------------ | --------------- |
| 特殊大号      | `text-3xl`（30px） | 视情况          |
| 页面主标题    | `text-xl`（20px）  | `font-semibold` |
| 区块/卡片标题 | `text-lg`（18px）  | `font-semibold` |
| 正文          | `text-sm`（14px）  | —               |
| 辅助文字      | `text-xs`（12px）  | —               |

## 图标

大部分图标统一维护在 src/shared/ui/icons.tsx 中。

默认使用 @tabler/icons-react 提供的图标。不要在业务代码中直接从图标库导入图标，也不要在组件内临时定义图标；应先在 icons.tsx 中统一注册，再通过 Icons 对象使用。

注册图标时必须按业务语义命名，不要直接使用图标库原始名称；例如使用 `specCreate`、`helpCenter`，而不是 `IconPlus`、`IconHelpCircle`。

### 正确示例

添加图标：

```typescript
import { IconRobot } from "@tabler/icons-react";

export const Icons = {
  logo: IconRobot,
};
```

使用的时候：

```typescript
import { Icons } from "@/shared/ui/icons";

<Icons.logo className="size-4" />
```

### 错误示例

不要在业务组件中直接从 @tabler/icons-react 导入图标：

```typescript
import { IconRobot } from "@tabler/icons-react";

export function Header() {
  return <IconRobot className="size-4" />;
}
```

不要在组件中内联 SVG：

```typescript
export function HeaderLogo() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="..." />
    </svg>
  );
}
```

新增图标时，应保持命名简洁、语义明确，并按语义分组放置。

## SVG 资源

少量自定义 SVG 图标存放在 shared/assets/icons 目录下。

不要在应用代码中内联 SVG，也不要将 SVG 图标放到其他目录。新增或修改 SVG 文件前，应使 SVGO 进行优化。

## SSR / Hydration 安全

- 整块 UI 只在客户端渲染 → `ClientOnly`（`@/shared/ui/client-only`）
- 组件内部分变量需要 SSR/客户端区分 → `useMounted`（`@/shared/hooks/use-mounted`）
- 浏览器 API（`localStorage`、`window`、`document.cookie` 等）在 `useEffect` 或回调中访问 → 不需要处理
