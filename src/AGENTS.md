# 前端开发指南

## 适用范围

本指南适用于前端相关代码。

注意：`shared/` 目录下的代码不一定都是前端代码，也可能包含后端共享逻辑。修改 `shared/` 下的文件时，先确认该文件的实际用途和调用方，不要默认按前端代码处理。

## UI 组件

优先使用 shadcn 组件进行开发。

项目内的 shadcn 组件统一放在 `shared/ui` 目录下。使用组件前，先检查 `shared/ui` 中是否已有可复用实现。

如果 shadcn 官方提供了某个组件，但本地尚未安装，可以使用：

```bash
pnpm dlx shadcn@latest add [组件名]
```

使用 shadcn 组件时，如果不确定组件 API、组合方式或最佳实践，应调用 /shadcn 技能查看正确用法。

## 图标

大部分图标统一维护在 src/shared/ui/icons.tsx 中。

默认使用 @tabler/icons-react 提供的图标。不要在业务代码中直接从图标库导入图标，也不要在组件内临时定义图标；应先在 icons.tsx 中统一注册，再通过 Icons 对象使用。

示例：

```typescript
export const Icons = {
  logo: IconRobot,

  // header
  brightness: IconBrightness,
  palette: IconPalette,

  eye: IconEye,
  eyeOff: IconEyeOff,
};
```

新增图标时，应保持命名简洁、语义明确，并按语义分组放置。

## SVG 资源

少量自定义 SVG 图标存放在 shared/assets/icons 目录下。

不要在应用代码中内联 SVG，也不要将 SVG 图标放到其他目录。新增或修改 SVG 文件前，应使 SVGO 进行优化。
