# CodeMirror 6 教学文档

> 从 0 开始，在 React 项目中使用 CodeMirror 6 搭建 Markdown 编辑器。
>
> 本文档基于官方文档编写，所有 API 和代码示例均来自：
>
> - [CodeMirror 官方系统指南](https://codemirror.net/docs/guide/)
> - [@uiw/react-codemirror 官方仓库](https://github.com/uiwjs/react-codemirror)
> - [@codemirror/lang-markdown 官方仓库](https://github.com/codemirror/lang-markdown)

---

## 目录

1. [是什么 & 为什么选它](#1-是什么--为什么选它)
2. [安装](#2-安装)
3. [最简示例：5 行代码跑起来](#3-最简示例5-行代码跑起来)
4. [核心概念：State / View / Extension / Transaction](#4-核心概念state--view--extension--transaction)
5. [Props 完整参考](#5-props-完整参考)
6. [Markdown 语言支持](#6-markdown-语言支持)
7. [主题](#7-主题)
8. [自定义快捷键](#8-自定义快捷键)
9. [通过 ref 操作编辑器实例](#9-通过-ref-操作编辑器实例)
10. [basicSetup 详解](#10-basicsetup-详解)
11. [自定义自动补全](#11-自定义自动补全)
12. [最佳实践](#12-最佳实践)

---

## 1. 是什么 & 为什么选它

**CodeMirror 6** 是一个用 TypeScript 从零重写的代码编辑器，特点是：

- **极轻量**：核心包 gzip 后约 30-50KB，编辑器秒开
- **视口渲染**：只渲染可见区域的行（加上缓冲区），即使打开 10 万行文档也不会卡
- **模块化**：所有功能（行号、历史、括号匹配、高亮…）都是 Extension，按需组装
- **不可变状态**：EditorState 是不可变的，每次修改通过 Transaction 生成新状态

**在 React 中使用**，推荐 `@uiw/react-codemirror` 这个封装库，它把 CodeMirror 6 包装成了受控组件，API 和 React 习惯一致。

---

## 2. 安装

### 安装 React 封装 + Markdown 语言包

```bash
npm install @uiw/react-codemirror
npm install @codemirror/lang-markdown
npm install @codemirror/language-data
```

| 包名                        | 用途                                                          |
| --------------------------- | ------------------------------------------------------------- |
| `@uiw/react-codemirror`     | React 封装，内部已包含 CodeMirror 6 核心                      |
| `@codemirror/lang-markdown` | Markdown 语法高亮和快捷键                                     |
| `@codemirror/language-data` | ~130 种语言的描述，用于 Markdown 代码块内高亮（如 ` ```js `） |

### 按需安装主题包（可选）

```bash
npm install @uiw/codemirror-theme-github   # GitHub 主题
npm install @uiw/codemirror-theme-vscode   # VS Code 主题
npm install @uiw/codemirror-theme-oneDark   # One Dark 主题
```

---

## 3. 最简示例：5 行代码跑起来

```jsx
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";

function App() {
  return (
    <CodeMirror
      value="# Hello World"
      extensions={[markdown()]}
      onChange={(value) => console.log(value)}
    />
  );
}
```

- `value`：受控值，Markdown 文本字符串
- `extensions`：功能插件数组，这里传入 `markdown()` 开启 Markdown 语法支持
- `onChange`：内容变化时的回调，签名 `(value: string, viewUpdate: ViewUpdate) => void`

---

## 4. 核心概念：State / View / Extension / Transaction

### EditorState（不可变状态）

```ts
// 存储文档内容、选区、以及所有配置（resolved extensions）
// 创建方式：
const state = EditorState.create({
  doc: "初始内容",
  extensions: [lineNumbers(), history()],
});
```

- **不可变**：创建后不能直接修改 `state.doc`
- 文档内容通过 `state.doc.toString()` 获取
- 选区通过 `state.selection` 获取

### EditorView（DOM 视图）

```ts
// 负责 DOM 渲染和用户交互
// 原生创建方式（@uiw 封装后你通常不用直接写）：
const view = new EditorView({
  state: state,
  parent: document.body,
});
```

- 持有当前 state，渲染到 DOM
- 处理键盘、鼠标等用户输入

### Extension（扩展/插件）

Extension 是 CodeMirror 的模块化积木。每个功能都是一个 Extension：

```ts
import { lineNumbers } from "@codemirror/view";
import { history } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";

// 它们都是 Extension，组装到数组里传入
const extensions = [
  lineNumbers(), // 行号
  history(), // 撤销/重做
  bracketMatching(), // 括号匹配高亮
  markdown(), // Markdown 语法
];
```

### Transaction（事务）

修改状态的唯一方式——通过 dispatch 一个 Transaction：

```ts
// 原生写法（@uiw 封装后你通常通过 value/onChange 操作）
view.dispatch({
  changes: { from: 0, to: view.state.doc.length, insert: "新内容" },
});
```

dispatch 后会生成新的 EditorState，并触发 ViewUpdate。

### ViewUpdate（更新对象）

在 `onChange` 和 `onUpdate` 回调中你会收到这个对象：

```ts
onChange={(value, viewUpdate) => {
  viewUpdate.docChanged      // boolean：文档是否变化
  viewUpdate.selection       // 当前选区
  viewUpdate.transactions    // 本次更新的事务数组
  viewUpdate.state           // 新的 EditorState
}}
```

> **onChange vs onUpdate**：`onChange` 只在文档变化时触发，`onUpdate` 在任何更新（包括滚动、聚焦）时触发。同步内容优先用 `onChange`。

---

## 5. Props 完整参考

`@uiw/react-codemirror` 暴露的所有 Props（来自 [core/src/index.tsx](https://github.com/uiwjs/react-codemirror/blob/master/core/src/index.tsx)）：

| Prop                      | 类型                                              | 默认值    | 说明                                          |
| ------------------------- | ------------------------------------------------- | --------- | --------------------------------------------- |
| `value`                   | `string`                                          | `""`      | 编辑器内容（受控）                            |
| `autoFocus`               | `boolean`                                         | `false`   | 挂载时自动聚焦                                |
| `placeholder`             | `string`                                          | —         | 内容为空时的占位文字                          |
| `height`                  | `string`                                          | —         | CSS 高度，如 `"300px"`                        |
| `minHeight` / `maxHeight` | `string`                                          | —         | CSS 最小/最大高度                             |
| `width`                   | `string`                                          | —         | CSS 宽度                                      |
| `minWidth` / `maxWidth`   | `string`                                          | —         | CSS 最小/最大宽度                             |
| `readOnly`                | `boolean`                                         | `false`   | 只读模式                                      |
| `editable`                | `boolean`                                         | `true`    | 是否允许编辑                                  |
| `indentWithTab`           | `boolean`                                         | `true`    | Tab 键缩进                                    |
| `basicSetup`              | `boolean \| BasicSetupOptions`                    | `true`    | 默认功能集（详见 [§10](#10-basicsetup-详解)） |
| `theme`                   | `'light' \| 'dark' \| 'none' \| Extension`        | `'light'` | 主题                                          |
| `extensions`              | `Extension[]`                                     | `[]`      | CodeMirror 扩展数组                           |
| `selection`               | `{ anchor: number; head?: number }`               | —         | 选区范围                                      |
| `onChange`                | `(value: string, viewUpdate: ViewUpdate) => void` | —         | 内容变化回调                                  |
| `onUpdate`                | `(viewUpdate: ViewUpdate) => void`                | —         | 每次视图更新回调                              |
| `onCreateEditor`          | `(view: EditorView, state: EditorState) => void`  | —         | 编辑器创建时回调                              |
| `onStatistics`            | `(data: Statistics) => void`                      | —         | 行数/字符数统计回调                           |

### 常用示例

```jsx
<CodeMirror
  value={content}
  height="300px"
  placeholder="写下你的想法…"
  theme="dark"
  readOnly={false}
  extensions={[markdown()]}
  onChange={(value) => setContent(value)}
/>
```

---

## 6. Markdown 语言支持

### 基础用法

```jsx
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";

<CodeMirror
  value="# 标题"
  extensions={[markdown({ base: markdownLanguage })]}
/>;
```

### 完整配置：代码块内高亮 + URL 补全

````jsx
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";

function MarkdownEditor() {
  return (
    <CodeMirror
      extensions={[
        markdown({
          base: markdownLanguage, // 以 Markdown 为基础语言
          codeLanguages: languages, // 让 ```js / ```ts 等代码块也有高亮
          addKeymap: true, // 开启 Markdown 专用快捷键（如回车自动续列表）
          completeURLs: true, // URL 自动补全
        }),
      ]}
    />
  );
}
````

### MarkdownConfig 配置项

| 字段                  | 类型                    | 默认值             | 说明                                                   |
| --------------------- | ----------------------- | ------------------ | ------------------------------------------------------ |
| `base`                | `LRLanguage`            | `markdownLanguage` | 基础语法，可换成 `commonmarkLanguage`（纯 CommonMark） |
| `codeLanguages`       | `LanguageDescription[]` | —                  | 代码块内识别的语言列表，传 `languages` 启用高亮        |
| `addKeymap`           | `boolean`               | `true`             | Markdown 专用快捷键（续列表、切换粗体等）              |
| `completeURLs`        | `boolean`               | `false`            | URL 自动补全                                           |
| `highlightFormatting` | `boolean`               | `false`            | 给 `*`、`` ` `` 等格式标记符加高亮 tag                 |
| `extensions`          | `Extension[]`           | —                  | 额外的 Markdown 扩展（如 `gfm()` 支持 GFM 表格）       |

### GFM 支持（表格、删除线、任务列表）

```jsx
import { markdown, markdownLanguage, gfm } from "@codemirror/lang-markdown";

markdown({
  base: markdownLanguage,
  extensions: [gfm()], // 开启 GitHub Flavored Markdown
});
```

---

## 7. 主题

### 内置明暗主题

```jsx
// 字符串方式
<CodeMirror theme="light" /> // 或 "dark"
```

### 预制主题包

```jsx
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";

<CodeMirror theme={isDark ? githubDark : githubLight} />;
```

### 自定义主题

```jsx
import { createTheme } from "@uiw/codemirror-themes";

const myTheme = createTheme({
  theme: "light",
  settings: {
    background: "#ffffff",
    foreground: "#1d1d1d",
    caret: "#aeafad",
    selection: "#d7d4f0",
    fontFamily: "monospace",
  },
  styles: [
    /* token 样式 */
  ],
});

<CodeMirror theme={myTheme} />;
```

---

## 8. 自定义快捷键

### 基本结构

```jsx
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";

const customKeymap = keymap.of([
  {
    key: "Mod-s", // Mod = macOS 的 Cmd / 其他系统的 Ctrl
    preventDefault: true, // 阻止浏览器默认行为
    run: (editor) => {
      // 你的保存逻辑
      return true; // 返回 true 表示事件已消费
    },
  },
  {
    key: "Mod-Enter", // Cmd/Ctrl + Enter 提交
    run: () => {
      /* submit */ return true;
    },
  },
  ...defaultKeymap, // 展开默认快捷键
]);

<CodeMirror extensions={[customKeymap]} />;
```

### 从 @codemirror/commands 导入的预设

```jsx
import {
  defaultKeymap,
  historyKeymap,
  searchKeymap,
} from "@codemirror/commands";

// defaultKeymap   → 通用快捷键（复制、粘贴、全选等）
// historyKeymap  → 撤销/重做（Cmd+Z / Cmd+Shift+Z）
// searchKeymap   → 搜索（Cmd+F / Cmd+G）
```

> **覆盖默认快捷键**：把你的 keymap 放在 `defaultKeymap` **前面**，或设置 `preventDefault: true`。

---

## 9. 通过 ref 操作编辑器实例

### 获取 ref

```tsx
import { useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";

function App() {
  const ref = useRef<ReactCodeMirrorRef>(null);

  const getValue = () => {
    // ref.current.view  → EditorView 实例
    // ref.current.state → EditorState 实例
    return ref.current?.view?.state.doc.toString();
  };

  const setValue = (newValue: string) => {
    const view = ref.current?.view;
    if (!view) return;
    // 通过 dispatch transaction 设置新值
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newValue },
    });
  };

  return <CodeMirror ref={ref} value="" extensions={[]} />;
}
```

### ReactCodeMirrorRef 结构

```ts
type ReactCodeMirrorRef = {
  editor?: HTMLDivElement; // 外层 DOM 元素
  state?: EditorState; // 当前状态
  view?: EditorView; // 编辑器视图实例
};
```

---

## 10. basicSetup 详解

`basicSetup` 默认开启（`true`），包含一组常用功能：

| 功能                        | 说明                            |
| --------------------------- | ------------------------------- |
| `history`                   | 撤销/重做（含 `historyKeymap`） |
| `lineNumbers`               | 行号                            |
| `foldGutter`                | 代码折叠                        |
| `drawSelection`             | 自定义选区渲染                  |
| `dropCursor`                | 拖拽时光标提示                  |
| `indentOnInput`             | 输入时自动缩进                  |
| `syntaxHighlighting`        | 语法高亮                        |
| `bracketMatching`           | 括号匹配                        |
| `closeBrackets`             | 自动闭合括号                    |
| `autocompletion`            | 自动补全                        |
| `highlightActiveLine`       | 当前行高亮                      |
| `highlightSelectionMatches` | 选中文本匹配高亮                |
| `rectangularSelection`      | 矩形多光标选区                  |
| `searchKeymap`              | 搜索快捷键                      |

### 逐项开关

```jsx
<CodeMirror
  basicSetup={{
    lineNumbers: false, // 关闭行号
    highlightActiveLine: false, // 关闭当前行高亮
    foldGutter: false, // 关闭代码折叠
    autocompletion: true, // 开启自动补全
    bracketMatching: true, // 开启括号匹配
    closeBrackets: true, // 开启自动闭合括号
    searchKeymap: true, // 开启搜索快捷键
  }}
/>
```

### 完全关闭

```jsx
<CodeMirror
  basicSetup={false}
  extensions={
    [
      /* 手动添加需要的扩展 */
    ]
  }
/>
```

---

## 11. 自定义自动补全

```jsx
import { autocompletion } from "@codemirror/autocomplete";

const completion = autocompletion({
  override: [
    (context) => {
      // matchBefore 获取当前光标前的匹配文本
      const word = context.matchBefore(/\w*/);
      if (!word) return null;

      return {
        from: word.from,
        options: [
          { label: "hello", type: "variable" },
          { label: "world", type: "variable" },
        ],
      };
    },
  ],
});

<CodeMirror extensions={[completion]} />;
```

---

## 12. 最佳实践

### ① 用 useMemo 缓存 extensions 数组

`@uiw/react-codemirror` 在 extensions 数组引用变化时会重新配置编辑器，每次渲染重建数组会导致性能开销。

```jsx
// ❌ 错误：每次渲染都创建新数组
<CodeMirror extensions={[markdown(), keymap.of([...])]} />

// ✅ 正确：用 useMemo 缓存
const extensions = useMemo(() => [
  markdown({ base: markdownLanguage, codeLanguages: languages }),
  customKeymap,
], []);

<CodeMirror extensions={extensions} />
```

> 来源：CodeMirror discuss 性能讨论帖 + @uiw/react-codemirror issue 线程

### ② 用 onChange 而非 onUpdate 同步内容

`onUpdate` 在每次视图更新（包括滚动、聚焦）时都触发，而 `onChange` 只在文档变化时触发。

```jsx
// ✅ 只在内容变化时同步
<CodeMirror onChange={(value) => setContent(value)} />

// ❌ 每次滚动都会执行
<CodeMirror onUpdate={(update) => {
  if (update.docChanged) {
    setContent(update.state.doc.toString());
  }
}} />
```

> 来源：[CodeMirror 官方讨论 — Proper way to listen for changes](https://discuss.codemirror.net/t/codemirror-6-proper-way-to-listen-for-changes/2395)

### ③ 不要在每次按键时把完整文档回灌给 value

CodeMirror 内部已经维护了文档状态，通过 `onChange` 把内容同步到 React 即可，不要用 React state 反向驱动 CodeMirror 的 `value`，否则会造成循环更新和光标跳动。

```jsx
// ✅ 单向数据流：CodeMirror → React state
const [content, setContent] = useState("");
<CodeMirror value={content} onChange={(value) => setContent(value)} />;
```

> 来源：[CodeMirror 官方讨论 — Suggestions for using with React workflow](https://discuss.codemirror.net/t/suggestions-for-using-with-react-workflow/2746)

### ④ 大文档场景：避免全文档扫描的扩展

CodeMirror 6 只渲染视口内的行（加上缓冲区），这是它的核心性能优势。但如果添加了正则高亮、全文档 lint 等扩展，每次按键都会全文档扫描，破坏视口渲染的优势。

> 已知问题：1-5k 行文档高亮卡顿（[discuss #7579](https://discuss.codemirror.net/t/syntax-highlighting-not-working-on-large-documents/7579)）、大 JSON 卡顿（[discuss #5928](https://discuss.codemirror.net/t/5928)）

### ⑤ 懒加载语言包

`@codemirror/language-data` 包含 ~130 种语言描述，体积较大。如果包体积敏感，可以只导入需要的语言，构建自定义的 `LanguageDescription[]` 数组。

### ⑥ onUpdate 回调里做轻量操作

在 `onUpdate` / `updateListener` 中先检查 `update.docChanged` / `update.viewportChanged`，确认有变化后再执行逻辑；耗时操作要做防抖。

> 来源：[Pamela Fox — Line highlighting extension for CodeMirror 6](https://blog.pamelafox.org/2022/07/line-highlighting-extension-for-code.html)

---

## 参考资料

- [CodeMirror 官方系统指南](https://codemirror.net/docs/guide/)
- [CodeMirror 官方 API 参考](https://codemirror.net/docs/ref/)
- [CodeMirror 配置示例](https://codemirror.net/examples/config/)
- [CodeMirror 自动补全示例](https://codemirror.net/examples/autocompletion/)
- [@uiw/react-codemirror GitHub](https://github.com/uiwjs/react-codemirror)
- [@uiw/react-codemirror 官方文档站](https://uiwjs.github.io/react-codemirror/)
- [@uiw/react-codemirror 源码（Props 定义）](https://github.com/uiwjs/react-codemirror/blob/master/core/src/index.tsx)
- [@codemirror/lang-markdown GitHub](https://github.com/codemirror/lang-markdown)
- [CodeMirror 6 + TypeScript 教程 — David Myers](https://davidmyers.dev/blog/how-to-build-a-code-editor-with-codemirror-6-and-typescript/introduction)
- [CodeMirror 官方讨论 — Proper way to listen for changes](https://discuss.codemirror.net/t/codemirror-6-proper-way-to-listen-for-changes/2395)
- [CodeMirror 官方讨论 — Suggestions for using with React workflow](https://discuss.codemirror.net/t/suggestions-for-using-react-workflow/2746)
- [How to setup Markdown using CodeMirror 6 — Tom Krush](https://tomkrush.com/blog/how-to-setup-markdown-using-codemirror-6)
