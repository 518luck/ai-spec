export const actions = [
  {
    id: "blog", //这一条命令的唯一标识。
    name: "Blog", //展示给用户看的名字。
    shortcut: ["b"], //这条命令绑定的快捷键。
    keywords: "writing words", //搜索关键词。
    perform: () => (window.location.pathname = "blog"), //点击命令时实际要执行的逻辑。
  },
  {
    id: "contact",
    name: "Contact",
    shortcut: ["c"],
    keywords: "email",
    perform: () => (window.location.pathname = "contact"),
  },
];
