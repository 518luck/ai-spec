# react-markdown 教学文档

> 从 0 开始，在 React 项目中使用 react-markdown 渲染 Markdown 内容。
>
> 本文档基于官方文档编写，所有 API 和代码示例均来自：
>
> - [react-markdown 官方仓库](https://github.com/remarkjs/react-markdown)
> - [remark-gfm 官方仓库](https://github.com/remarkjs/remark-gfm)
> - [remark-math 官方仓库](https://github.com/remarkjs/remark-math)
> - [rehype-pretty-code 官方文档](https://rehype-pretty-code.netlify.app/)

---

## 目录

1. [是什么 & 为什么选它](#1-是什么--为什么选它)
2. [安装](#2-安装)
3. [最简示例：3 行代码跑起来](#3-最简示例3-行代码跑起来)
4. [核心概念：remark 与 rehype 管线](#4-核心概念remark-与-rehype-管线)
5. [Props 完整参考](#5-props-完整参考)
6. [自定义组件渲染](#6-自定义组件渲染)
7. [remark 插件（Markdown 阶段）](#7-remark-插件markdown-阶段)
8. [rehype 插件（HTML 阶段）](#8-rehype-插件html-阶段)
9. [代码块语法高亮](#9-代码块语法高亮)
10. [数学公式渲染（KaTeX）](#10-数学公式渲染katex)
11. [完整管线示例](#11-完整管线示例)
12. [插件顺序规则](#12-插件顺序规则)
13. [安全与防护](#13-安全与防护)
14. [最佳实践](#14-最佳实践)

---

## 1. 是什么 & 为什么选它

**react-markdown** 是一个把 Markdown 文本渲染成 React 组件的库，核心特点：

- **安全**：默认不渲染原始 HTML，不会触发 `dangerouslySetInnerHTML`，天然防 XSS
- **可组合**：基于 unified 生态，remark/rehype 插件可自由拼装
- **React 原生**：输出的是 React 元素，不是 HTML 字符串，天然支持 React 生态
- **可定制**：通过 `components` prop 可以覆盖任意 HTML 标签的渲染

**与编辑器的区别**：react-markdown 只负责**渲染（看）**，不能编辑。如果需要编辑功能，配合 CodeMirror / Textarea 等。

---

## 2. 安装

### 核心包

```bash
npm install react-markdown
```

### 常用插件（按需安装）

```bash
# GFM 扩展：表格、删除线、任务列表、自动链接
npm install remark-gfm

# 数学公式解析：识别 $...$ 和 $$...$$
npm install remark-math

# 数学公式渲染：用 KaTeX 渲染数学节点
npm install rehype-katex

# 代码高亮（highlight.js 方案）
npm install rehype-highlight

# 代码高亮（Shiki 方案，VS Code 同款语法）
npm install rehype-pretty-code shiki

# 允许原始 HTML（注意安全，需配合 rehype-sanitize）
npm install rehype-raw
npm install rehype-sanitize

# 给标题加 id（配合锚点跳转）
npm install rehype-slug
```

---

## 3. 最简示例：3 行代码跑起来

```jsx
import Markdown from "react-markdown";

function App() {
  return <Markdown># Hello, *world*!</Markdown>;
}
```

渲染结果：

```html
<h1>Hello, <em>world</em>!</h1>
```

Markdown 文本通过 `children` prop 传入（字符串形式）。

---

## 4. 核心概念：remark 与 rehype 管线

react-markdown 内部基于 unified 生态，处理流程分**两个阶段**：

```
Markdown 字符串
      │
      ▼  [parse] remark-parse → 解析为 mdast
  mdast（Markdown 抽象语法树）
      │
      ▼  [remark 插件在此运行] — remark-gfm、remark-math
  mdast（变换后的 Markdown AST）
      │
      ▼  [remark-rehype] → mdast 转换为 hast
  hast（HTML 抽象语法树）
      │
      ▼  [rehype 插件在此运行] — rehype-katex、rehype-highlight
  hast（变换后的 HTML AST）
      │
      ▼  [内部渲染] hast → React 元素
  React 树
```

| 阶段   | 操作对象              | 插件示例                       | 职责                                   |
| ------ | --------------------- | ------------------------------ | -------------------------------------- |
| remark | mdast（Markdown AST） | remark-gfm、remark-math        | 解析/变换 Markdown 语法结构            |
| rehype | hast（HTML AST）      | rehype-katex、rehype-highlight | 变换 HTML 结构（渲染公式、代码高亮等） |

**记住这个规则**：

- `remarkPlugins` 处理 Markdown 语法层面的东西（表格、公式标记）
- `rehypePlugins` 处理 HTML 渲染层面的东西（公式渲染、代码着色）

---

## 5. Props 完整参考

| Prop            | 类型            | 默认值                | 说明                                  |
| --------------- | --------------- | --------------------- | ------------------------------------- |
| `children`      | `string`        | —                     | Markdown 源文本（必填）               |
| `className`     | `string`        | —                     | 外层包裹元素的 CSS 类名               |
| `remarkPlugins` | `PluggableList` | `[]`                  | remark 插件列表（操作 mdast）         |
| `rehypePlugins` | `PluggableList` | `[]`                  | rehype 插件列表（操作 hast）          |
| `components`    | `Components`    | —                     | 覆盖 HTML 标签的渲染组件              |
| `urlTransform`  | `(url) => url`  | `defaultUrlTransform` | URL 转换函数（过滤 `javascript:` 等） |
| `skipHtml`      | `boolean`       | `false`               | 跳过 Markdown 中的原始 HTML           |
| `sourcePos`     | `boolean`       | `false`               | 在元素上添加 `data-sourcepos` 属性    |

> **v9 变化**：`urlTransform` 取代了旧的 `transformLinkUri` / `transformImageUri`，统一处理所有 URL。

---

## 6. 自定义组件渲染

通过 `components` prop 覆盖任意 HTML 标签的渲染方式：

```jsx
import Markdown from "react-markdown";

const components = {
  // 标题加颜色
  h1: ({ node, ...props }) => <h1 style={{ color: "tomato" }} {...props} />,

  // 段落加字号
  p: ({ node, ...props }) => <p style={{ fontSize: "18px" }} {...props} />,

  // 链接强制新标签页打开
  a: ({ node, ...props }) => (
    <a target="_blank" rel="noopener noreferrer" {...props} />
  ),

  // 图片限制最大宽度
  img: ({ node, ...props }) => <img style={{ maxWidth: "100%" }} {...props} />,

  // 代码块自定义样式
  code: ({ node, inline, className, children, ...props }) => (
    <code className={className} {...props}>
      {children}
    </code>
  ),
};

<Markdown components={components}>{markdown}</Markdown>;
```

### components prop 的值类型

每个 key 可以是：

1. **字符串**：替换为另一个 HTML 标签，如 `h1: 'h2'`
2. **React 组件**：接收该标签的 HTML 属性作为 props

```ts
type Components = {
  [TagName in keyof JSX.IntrinsicElements]?:
    | keyof JSX.IntrinsicElements
    | React.ComponentType<JSX.IntrinsicElements[TagName]>;
};
```

---

## 7. remark 插件（Markdown 阶段）

### remark-gfm（GitHub Flavored Markdown）

```bash
npm install remark-gfm
```

添加 GFM 扩展语法支持：

| 语法                  | 效果           |
| --------------------- | -------------- |
| `\| 表格 \|`          | 管道表格       |
| `~~删除线~~`          | 删除线         |
| `- [x] 任务`          | 任务列表复选框 |
| `https://example.com` | 自动链接       |

```jsx
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdown = `
| 功能     | 状态 |
|----------|------|
| 表格     | ✅   |
| 删除线   | ✅   |

~~已废弃~~

- [x] 完成的任务
- [ ] 待办任务

https://example.com 自动变成链接
`;

<Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>;
```

### remark-math（数学公式解析）

```bash
npm install remark-math
```

识别 LaTeX 数学语法，标记为数学节点（**只解析，不渲染**，渲染需要配合 rehype-katex）：

| 语法                 | 含义     |
| -------------------- | -------- |
| `$E = mc^2$`         | 行内公式 |
| `$$\int_0^1 x\,dx$$` | 块级公式 |

```jsx
import remarkMath from "remark-math";

<Markdown remarkPlugins={[remarkMath]}>{markdown}</Markdown>;
```

---

## 8. rehype 插件（HTML 阶段）

### rehype-katex（公式渲染）

```bash
npm install remark-math rehype-katex
```

把 remark-math 标记的数学节点用 KaTeX 渲染成 HTML：

```jsx
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // ⚠️ 必须导入 CSS，否则公式无样式

const markdown = `
勾股定理：$a^2 + b^2 = c^2$

$$
\\frac{n!}{k!(n-k)!} = \\binom{n}{k}
$$
`;

<Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
  {markdown}
</Markdown>;
```

> **关键**：必须导入 `katex/dist/katex.min.css`，否则公式没有排版样式。

### rehype-raw（允许原始 HTML）

```bash
npm install rehype-raw
```

默认情况下 react-markdown 会忽略 Markdown 中的原始 HTML。使用 rehype-raw 可以解析并渲染它们：

```jsx
import rehypeRaw from "rehype-raw";

const markdown = `
普通文本 <span style="color: red;">内联 HTML</span>。
<div class="custom">块级 HTML</div>
`;

<Markdown rehypePlugins={[rehypeRaw]}>{markdown}</Markdown>;
```

> ⚠️ **安全警告**：rehype-raw 开启后存在 XSS 风险，必须配合 rehype-sanitize（见 [§13](#13-安全与防护)）。

### rehype-slug（标题加 ID）

```bash
npm install rehype-slug
```

给所有标题元素自动添加 `id` 属性，配合锚点跳转：

```jsx
import rehypeSlug from "rehype-slug";

<Markdown rehypePlugins={[rehypeSlug]}>{markdown}</Markdown>;

// ## 我的标题  →  <h2 id="我的标题">我的标题</h2>
```

---

## 9. 代码块语法高亮

### 方案 A：rehype-highlight（highlight.js）

```bash
npm install rehype-highlight
```

**轻量、适合客户端渲染**：

```jsx
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // 导入主题 CSS

const markdown = `
\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`
`;

<Markdown rehypePlugins={[rehypeHighlight]}>{markdown}</Markdown>;
```

传配置项（注意嵌套数组写法）：

```jsx
rehypePlugins={[
  [rehypeHighlight, { detect: true, subset: ['js', 'css', 'html'] }],
]}
```

### 方案 B：rehype-pretty-code（Shiki）

```bash
npm install rehype-pretty-code shiki
```

**高质量、VS Code 同款 TextMate 语法**：

```jsx
import rehypePrettyCode from "rehype-pretty-code";

/** @type {import('rehype-pretty-code').Options} */
const options = {
  theme: "github-dark",
  keepBackground: true,
  onVisitLine(node) {
    // 防止空行在 display:grid 下塌陷
    if (node.children.length === 0) {
      node.children = [{ type: "text", value: " " }];
    }
  },
};

<Markdown rehypePlugins={[[rehypePrettyCode, options]]}>{markdown}</Markdown>;
```

配套 CSS：

```css
[data-rehype-pretty-code-figure] pre {
  overflow-x: auto;
}
[data-rehype-pretty-code-figure] code {
  display: grid;
}
```

### 方案对比

| 特性                 | rehype-highlight        | rehype-pretty-code       |
| -------------------- | ----------------------- | ------------------------ |
| 引擎                 | highlight.js (lowlight) | Shiki (VS Code TextMate) |
| 高亮准确度           | 良好                    | 极佳                     |
| 包体积               | 较小                    | 较大（含 WASM）          |
| 需要 CSS 主题        | 是                      | 否（内联样式）           |
| 行号 / 行高亮        | 不支持                  | 支持                     |
| 客户端渲染           | 优秀                    | 较慢（WASM 加载）        |
| 构建时渲染 (SSR/SSG) | 支持                    | 极佳                     |
| 适用场景             | 轻量 CSR 应用           | 博客、文档站、SSG        |

---

## 10. 数学公式渲染（KaTeX）

### 完整步骤

```bash
npm install remark-math rehype-katex
```

```jsx
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// 必须导入 KaTeX 样式
import "katex/dist/katex.min.css";

const markdown = `
行内公式：$a^2 + b^2 = c^2$

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
`;

function MathMarkdown() {
  return (
    <Markdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
    >
      {markdown}
    </Markdown>
  );
}
```

> **`throwOnError: false`**：遇到无效公式时不抛异常，避免页面崩溃。

### 导入 KaTeX CSS 的三种方式

```jsx
// 方式 A：JS 中导入（推荐，Webpack/Vite 自动处理）
import "katex/dist/katex.min.css";
```

```html
<!-- 方式 B：HTML head 中引入 CDN -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
  crossorigin="anonymous"
/>
```

---

## 11. 完整管线示例

把所有插件组合到一起：

```jsx
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";

import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

const markdown = `
# 完整 Demo

这有 ~~删除线~~ 和一个 [链接](https://example.com)。

| 列 A | 列 B |
|------|------|
| 1    | 2    |

- [x] 已完成
- [ ] 待办

行内公式：$E = mc^2$

$$
f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}
$$

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

<span style="color: purple;">原始 HTML</span>
`;

function MarkdownRenderer({ content }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeSlug, rehypeKatex, rehypeHighlight]}
    >
      {content}
    </Markdown>
  );
}
```

---

## 12. 插件顺序规则

插件按数组顺序依次执行，每个插件接收前一个插件的输出。顺序错误会导致渲染失败。

### 核心规则

| 规则                                                      | 原因                                                   |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `remark-math` 放在 `remarkPlugins`                        | 它是 remark 插件，在 mdast 阶段标记数学节点            |
| `rehype-katex` 放在 `rehypePlugins` 且在 remark-math 之后 | 它消费 remark-math 产生的数学节点                      |
| `rehype-raw` 放在 rehype 插件**最前面**                   | 它把原始 HTML 字符串解析成 hast 节点，其他插件才能看到 |
| `rehype-sanitize` 放在 rehype 插件**最后面**              | 等所有变换完成后，再检查清理危险节点                   |
| `rehype-highlight` 和 `rehype-katex` 之间顺序             | 基本不影响，互相独立                                   |

### 传配置项的语法

```jsx
// 不带配置项：直接传插件
rehypePlugins={[rehypeRaw, rehypeSlug]}

// 带配置项：用嵌套数组 [插件, 配置对象]
rehypePlugins={[
  rehypeRaw,
  [rehypeHighlight, { detect: true }],
  [rehypeKatex, { throwOnError: false }],
]}
```

---

## 13. 安全与防护

### 陷阱 1：不要用 dangerouslySetInnerHTML

react-markdown 的设计初衷就是避免 `dangerouslySetInnerHTML`。永远不要这样做：

```jsx
// ❌ 极其危险，直接打开 XSS 大门
<div dangerouslySetInnerHTML={{ __html: marked(markdown) }} />
```

### 陷阱 2：rehype-raw 必须配合 rehype-sanitize

如果允许原始 HTML，必须做净化：

```bash
npm install rehype-raw rehype-sanitize
```

```jsx
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// rehype-raw 在前（解析 HTML），rehype-sanitize 在后（清理危险节点）
<Markdown rehypePlugins={[rehypeRaw, [rehypeSanitize, defaultSchema]]}>
  {untrustedMarkdown}
</Markdown>;
```

### 陷阱 3：react-markdown 默认是安全的

如果你**不使用 rehype-raw**，react-markdown 默认会忽略 Markdown 中的原始 HTML，并且 v9 的 `urlTransform` 会自动过滤 `javascript:` 等危险 URL。只有在明确需要 HTML 透传时才开启 rehype-raw。

### 安全建议

- 不需要原始 HTML → 不装 rehype-raw，默认安全
- 需要原始 HTML → rehype-raw + rehype-sanitize 必须一起用
- 用户输入来源不可信 → 考虑额外加一层 DOMPurify

---

## 14. 最佳实践

### ① 用 React.memo 包裹渲染组件

react-markdown 每次重新渲染都会重新解析整个 Markdown 树，用 `React.memo` 避免不必要的重渲染：

```jsx
const MemoizedMarkdown = React.memo(function MarkdownRenderer({ content }) {
  return <Markdown>{content}</Markdown>;
});
```

> 来源：[react-markdown 官方 README](https://github.com/remarkjs/react-markdown) + 社区性能讨论

### ② 用 useMemo 缓存插件和 components

每次渲染传入新的数组/对象引用会导致 react-markdown 重新处理 Markdown：

```jsx
function MyComponent({ content }) {
  // ❌ 每次渲染创建新数组，触发重新解析
  return <Markdown rehypePlugins={[rehypeKatex]}>{content}</Markdown>;

  // ✅ 用 useMemo 保持引用稳定
  const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
  const rehypePlugins = useMemo(
    () => [rehypeKatex, [rehypeHighlight, { detect: true }]],
    [],
  );
  const components = useMemo(
    () => ({
      a: ({ node, ...props }) => (
        <a target="_blank" rel="noreferrer" {...props} />
      ),
    }),
    [],
  );

  return (
    <Markdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {content}
    </Markdown>
  );
}
```

或定义在组件外部（模块作用域）：

```jsx
// ✅ 模块作用域，引用永远稳定
const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

function MyComponent({ content }) {
  return (
    <Markdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>
      {content}
    </Markdown>
  );
}
```

> 来源：[react-markdown 官方 README](https://github.com/remarkjs/react-markdown)

### ③ 分块记忆化：流式渲染 / 大文档场景

对于流式输出（如 AI 聊天）或超长文档，把 Markdown 按段落分块，每块单独 memo，只有变化的块重新解析：

```jsx
import React, { useMemo } from "react";
import Markdown from "react-markdown";

const MemoizedMarkdownBlock = React.memo(
  ({ content }) => <Markdown>{content}</Markdown>,
  (prevProps, nextProps) => prevProps.content === nextProps.content,
);

function MemoizedMarkdown({ content }) {
  // 按双换行（段落分隔）拆分
  const blocks = useMemo(() => content.split(/(\n\n)/), [content]);

  return (
    <>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock key={index} content={block} />
      ))}
    </>
  );
}
```

> 来源：[AI SDK 官方 Cookbook — Markdown Chatbot with Memoization](https://ai-sdk.dev/cookbook/next/markdown-chatbot-with-memoization)

### ④ 编辑器联动时防抖

如果 react-markdown 和 CodeMirror/Textarea 实时联动，每次按键都会触发重新解析。对长文档应该加防抖：

```jsx
function EditorWithPreview() {
  const [content, setContent] = useState("");
  const [debouncedContent, setDebouncedContent] = useState("");

  // 防抖：用户停止输入 300ms 后才更新预览
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedContent(content), 300);
    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="flex">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <Markdown>{debouncedContent}</Markdown>
    </div>
  );
}
```

### ⑤ 链接覆盖：强制安全跳转

始终覆盖 `a` 标签，确保外部链接在新标签页打开，并防止 `tabnabbing`：

```jsx
const components = {
  a: ({ node, ...props }) => (
    <a target="_blank" rel="noopener noreferrer" {...props} />
  ),
};
```

### ⑥ SSR/SSG 场景优先构建时高亮

如果项目使用 SSG（如 Next.js 静态导出），代码高亮优先选 `rehype-pretty-code` 在构建时完成，而不是 `rehype-highlight` 在运行时处理。Shiki 的 WASM 在运行时加载较慢。

> 来源：[rehype-pretty-code 官方文档](https://rehype-pretty-code.netlify.app/)

---

## 参考资料

- [react-markdown 官方 README](https://github.com/remarkjs/react-markdown)
- [remark-gfm 官方仓库](https://github.com/remarkjs/remark-gfm)
- [remark-math 官方 README](https://github.com/remarkjs/remark-math)
- [rehype-highlight 官方 README](https://github.com/rehypejs/rehype-highlight)
- [rehype-raw 官方 README](https://github.com/rehypejs/rehype-raw)
- [rehype-pretty-code 官方文档](https://rehype-pretty-code.netlify.app/)
- [AI SDK Cookbook — Markdown Chatbot with Memoization](https://ai-sdk.dev/cookbook/next/markdown-chatbot-with-memoization)
- [Strapi — React Markdown 完整指南（安全与样式）](https://strapi.io/blog/react-markdown-complete-guide-security-styling)
