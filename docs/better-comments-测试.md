# Better Comments 测试文档

> 在 VSCode 中打开此文件，验证 Better Comments 各层级注释是否正确高亮。
> 验证清单：颜色区分是否明显、暖冷色是否分层、背景框是否生效。

---

## TypeScript 注释测试

```typescript
// # Better Comments 测试文件 —— 验证各层级注释高亮效果

// @ 区块级标题测试

// > 单元级函数说明
function testFunction(param: string): void {
  // 普通注释：这是默认的灰色注释，用于步骤级说明
  console.log(param);

  // ! 这是一个警示级注释，提醒有坑或者危险操作
  if (param === "danger") {
    throw new Error("危险输入");
  }

  // ? 这是一个疑问级注释，标记待确认的逻辑
  // ? 是否需要在这里做参数校验？
}

// @ 第二个区块

// > 另一个函数
function anotherFunction(): number {
  // 普通步骤说明
  const result = 42;

  // ! 返回值不能是负数
  return Math.abs(result);
}
```

---

## 混合层级测试

```typescript
// # 配置模块 —— 管理全局配置读写

// @ 常量定义
const MAX_RETRY = 3; // 普通注释：最大重试次数

// @ 类型定义
type Config = {
  // > 配置项名称
  name: string;
  // > 配置项值
  value: unknown;
};

// @ 核心函数
function loadConfig(): Config {
  // 普通步骤：先读文件
  const raw = readFileSync("./config.json");

  // ? 文件不存在时应该用默认值还是报错？
  if (!raw) {
    // ! 文件读取失败必须抛错，不能静默返回空
    throw new Error("配置文件读取失败");
  }

  return JSON.parse(raw);
}
```

---

## 验证要点

打开此文件后，逐项确认：

- [ ] `// #` 开头的注释显示为 **金色加粗 + 金色背景框**
- [ ] `// @` 开头的注释显示为 **橙色**
- [ ] `// >` 开头的注释显示为 **紫色**
- [ ] `// !` 开头的注释显示为 **红色 + 红色背景框**
- [ ] `// ?` 开头的注释显示为 **亮绿色斜体**
- [ ] 普通注释保持 **默认灰色**
- [ ] 暖色（# 金 / @ 橙）和冷色（> 紫 / ? 绿）能一眼区分

如果某项不生效，检查全局 settings.json 的 `better-comments.tags` 配置是否被正确加载，必要时重启 VSCode。
