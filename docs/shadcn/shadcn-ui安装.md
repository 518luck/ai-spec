# shadcn/ui 安装笔记

## 1. 三种接入方式

shadcn/ui 在 Next.js 里主要有三种起步方式：

- `shadcn/create`：网页入口，适合新建项目时先可视化选择风格
- `CLI`：命令行入口，适合直接在终端里初始化新项目
- `Existing Project`：给已有 Next.js 项目接入 shadcn/ui

这三种方式不是三套不同的技术方案，而是三种不同的开始路径。

对当前项目来说，最 relevant 的是 `Existing Project`，因为项目已经存在。

---

## 2. 当前项目应该看哪一部分

当前项目已经具备这些条件：

- 已经是 Next.js 项目
- 已经启用了 App Router
- 已经有 Tailwind CSS
- 已经配置了 `@/* -> ./src/*`

所以不需要再走“新建项目”的路线，直接参考 `Existing Project` 即可。

推荐流程：

1. `npx shadcn@latest init`
2. `npx shadcn@latest add button`
3. `npx shadcn@latest add accordion`

然后再决定这些组件在 FSD 结构里如何落位。

---

## 3. Existing Project 这部分到底在讲什么

### 3.1 Create Project

文档先说：如果你还没有 Next 项目，就先创建一个。

```bash
npx create-next-app@latest
```

如果你已经有项目，就跳过这一步。

它推荐使用 `create-next-app` 的默认配置，因为默认会帮你配好这些内容：

- Tailwind CSS
- App Router
- `@/*` 路径别名

如果你更喜欢 `src/` 目录结构，可以使用：

```bash
npx create-next-app@latest --src-dir
```

这句话的意思是：

- Next 应用代码会放在 `src/app`
- `@/*` 会映射到 `./src/*`

这一点和当前项目是一致的。

### 3.2 Configure Tailwind CSS and Import Aliases

如果项目不是用标准方式新建的，而是旧项目或自定义项目，就要自己确认两件事。

#### Tailwind CSS 是否已配置

shadcn/ui 依赖 Tailwind 的样式体系，所以项目里必须先有 Tailwind。

#### `@/*` 路径别名是否已配置

例如：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

如果项目采用 `src-dir` 结构，就应该配置成：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

当前项目这一点已经满足。

### 3.3 Run the CLI

这一步才是真正把 shadcn/ui 接进现有项目：

```bash
npx shadcn@latest init
```

这条命令一般会做这些事情：

- 检查 Next.js / Tailwind 环境
- 生成或更新 shadcn 相关配置
- 创建组件输出目录
- 配置一些基础工具函数和样式约定

这里要特别注意：

`init` 不是安装所有组件，而是在初始化基础设施。

### 3.4 Add Components

初始化之后，再按需添加具体组件：

```bash
npx shadcn@latest add button
```

例如这条命令会把 Button 组件生成到项目里。

然后你就可以在页面里这样使用：

```tsx
import { Button } from "@/components/ui/button";
```

一般来说，执行这类命令后，项目里会新增类似这些文件：

- `components/ui/button.tsx`
- `lib/utils.ts`
- 部分样式或配置文件

如果项目采用 `src-dir`，那页面入口示例通常会写成 `src/app/page.tsx`。

---

## 4. 结合 FSD 应该怎么理解

shadcn 文档里的示例通常是最简单的 Next.js 项目写法，比如直接写：

- `app/page.tsx`
- `@/components/ui/button`

但当前项目是 FSD 结构，所以不能机械照搬目录。

更准确的理解应该是：

- 文档里的 `app/page.tsx` 只是演示组件怎么使用
- 当前项目的页面实现仍然应该放在 FSD 对应层级
- shadcn 生成出来的基础 UI 更适合收口到 `src/shared/ui`

也就是说，当前项目真正要关注的是“组件能力如何接入”，而不是“示例页面放在哪”。

---

## 5. 当前项目的推荐做法

对当前这个严格 FSD 项目，更推荐这样理解：

- 先用 `npx shadcn@latest init` 初始化
- 再按需执行 `npx shadcn@latest add ...`
- 不要长期无脑沿用默认的 `components/ui`
- 后续可以逐步整理到 `src/shared/ui`

通常有两种落地方式：

### 5.1 保守做法

先接受 shadcn 默认生成位置，确认能跑通后再重构。

### 5.2 严格做法

在保持功能不变的前提下，把生成出来的通用 UI 收口到 `src/shared/ui`，更符合严格 FSD。

---

## 6. 读这篇文档时最该抓住的点

- `init` 是初始化，不是安装所有组件
- `add button`、`add card` 才是在添加具体组件
- `shadcn/create` 和 `CLI` 主要解决“新建项目怎么开始”
- 对已有项目，重点看 `Existing Project`
- 文档里的 `app/page.tsx` 只是示例，不代表业务代码必须照那个位置写

---

## 7. 一句话结论

对当前项目来说，不需要重新建项目，直接按 `Existing Project` 路线接入 shadcn/ui 即可；真正需要多想一步的是，接入之后如何把组件整理进 FSD 结构。
