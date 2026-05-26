# 图标

**导入时始终使用项目配置的 `iconLibrary`。** 检查项目上下文中的 `iconLibrary` 字段：`lucide` → `lucide-react`，`tabler` → `@tabler/icons-react` 等。绝不要假定使用 `lucide-react`。

---

## Button 中的图标使用 data-icon 属性

在图标上添加 `data-icon="inline-start"`（前缀）或 `data-icon="inline-end"`（后缀）。不要在图标上添加尺寸 class。

**错误：**

```tsx
<Button>
  <SearchIcon className="mr-2 size-4" />
  Search
</Button>
```

**正确：**

```tsx
<Button>
  <SearchIcon data-icon="inline-start"/>
  Search
</Button>

<Button>
  Next
  <ArrowRightIcon data-icon="inline-end"/>
</Button>
```

---

## 组件内部图标不要添加尺寸 class

组件会通过 CSS 处理图标尺寸。不要给 `Button`、`DropdownMenuItem`、`Alert`、`Sidebar*` 或其他 shadcn 组件内部的图标添加 `size-4`、`w-4 h-4` 或其他尺寸 class，除非用户明确要求自定义图标尺寸。

**错误：**

```tsx
<Button>
  <SearchIcon className="size-4" data-icon="inline-start" />
  Search
</Button>

<DropdownMenuItem>
  <SettingsIcon className="mr-2 size-4" />
  Settings
</DropdownMenuItem>
```

**正确：**

```tsx
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>

<DropdownMenuItem>
  <SettingsIcon />
  Settings
</DropdownMenuItem>
```

---

## 以组件对象形式传递图标，不要使用字符串键

使用 `icon={CheckIcon}`，不要使用指向查找表的字符串键。

**错误：**

```tsx
const iconMap = {
  check: CheckIcon,
  alert: AlertIcon,
}

function StatusBadge({ icon }: { icon: string }) {
  const Icon = iconMap[icon]
  return <Icon />
}

<StatusBadge icon="check" />
```

**正确：**

```tsx
// Import from the project's configured iconLibrary (e.g. lucide-react, @tabler/icons-react).
import { CheckIcon } from "lucide-react"

function StatusBadge({ icon: Icon }: { icon: React.ComponentType }) {
  return <Icon />
}

<StatusBadge icon={CheckIcon} />
```
