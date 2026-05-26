# Base 与 Radix

`base` 与 `radix` 之间的 API 差异。通过 `npx shadcn@latest info` 检查 `base` 字段。

## 目录

- 组合：asChild 与 render
- Button / trigger 作为非 button 元素
- Select（items prop、placeholder、positioning、multiple、object values）
- ToggleGroup（type 与 multiple）
- Slider（标量与数组）
- Accordion（type 和 defaultValue）

---

## 组合：asChild（radix）与 render（base）

Radix 使用 `asChild` 替换默认元素。Base 使用 `render`。不要把 triggers 包在额外元素里。

**错误：**

```tsx
<DialogTrigger>
  <div>
    <Button>Open</Button>
  </div>
</DialogTrigger>
```

**正确（radix）：**

```tsx
<DialogTrigger asChild>
  <Button>Open</Button>
</DialogTrigger>
```

**正确（base）：**

```tsx
<DialogTrigger render={<Button />}>Open</DialogTrigger>
```

这适用于所有 trigger 和 close 组件：`DialogTrigger`、`SheetTrigger`、`AlertDialogTrigger`、`DropdownMenuTrigger`、`PopoverTrigger`、`TooltipTrigger`、`CollapsibleTrigger`、`DialogClose`、`SheetClose`、`NavigationMenuLink`、`BreadcrumbLink`、`SidebarMenuButton`、`Badge`、`Item`。

---

## Button / trigger 作为非 button 元素（仅 base）

当 `render` 将元素改为非 button（`<a>`、`<span>`）时，添加 `nativeButton={false}`。

**错误（base）：** 缺少 `nativeButton={false}`。

```tsx
<Button render={<a href="/docs" />}>Read the docs</Button>
```

**正确（base）：**

```tsx
<Button render={<a href="/docs" />} nativeButton={false}>
  Read the docs
</Button>
```

**正确（radix）：**

```tsx
<Button asChild>
  <a href="/docs">Read the docs</a>
</Button>
```

`render` 不是 `Button` 的 trigger 也一样：

```tsx
// base.
<PopoverTrigger render={<InputGroupAddon />} nativeButton={false}>
  Pick date
</PopoverTrigger>
```

---

## Select

**items prop（仅 base）。** Base 要求 root 上有 `items` prop。Radix 只使用内联 JSX。

**错误（base）：**

```tsx
<Select>
  <SelectTrigger><SelectValue placeholder="Select a fruit" /></SelectTrigger>
</Select>
```

**正确（base）：**

```tsx
const items = [
  { label: "Select a fruit", value: null },
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
]

<Select items={items}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

**正确（radix）：**

```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

**Placeholder。** Base 在 items 数组中使用 `{ value: null }` item。Radix 使用 `<SelectValue placeholder="...">`。

**Content positioning。** Base 使用 `alignItemWithTrigger`。Radix 使用 `position`。

```tsx
// base.
<SelectContent alignItemWithTrigger={false} side="bottom">

// radix.
<SelectContent position="popper">
```

---

## Select — 多选和对象值（仅 base）

Base 支持 `multiple`、`SelectValue` 上的 render-function children，以及通过 `itemToStringValue` 使用对象值。Radix 仅支持 string 值的单选。

**正确（base — 多选）：**

```tsx
<Select items={items} multiple defaultValue={[]}>
  <SelectTrigger>
    <SelectValue>
      {(value: string[]) => value.length === 0 ? "Select fruits" : `${value.length} selected`}
    </SelectValue>
  </SelectTrigger>
  ...
</Select>
```

**正确（base — 对象值）：**

```tsx
<Select defaultValue={plans[0]} itemToStringValue={(plan) => plan.name}>
  <SelectTrigger>
    <SelectValue>{(value) => value.name}</SelectValue>
  </SelectTrigger>
  ...
</Select>
```

---

## ToggleGroup

Base 使用 `multiple` boolean prop。Radix 使用 `type="single"` 或 `type="multiple"`。

**错误（base）：**

```tsx
<ToggleGroup type="single" defaultValue="daily">
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
</ToggleGroup>
```

**正确（base）：**

```tsx
// Single (no prop needed), defaultValue is always an array.
<ToggleGroup defaultValue={["daily"]} spacing={2}>
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
  <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
</ToggleGroup>

// Multi-selection.
<ToggleGroup multiple>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
</ToggleGroup>
```

**正确（radix）：**

```tsx
// Single, defaultValue is a string.
<ToggleGroup type="single" defaultValue="daily" spacing={2}>
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
  <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
</ToggleGroup>

// Multi-selection.
<ToggleGroup type="multiple">
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
</ToggleGroup>
```

**受控单值：**

```tsx
// base — wrap/unwrap arrays.
const [value, setValue] = React.useState("normal")
<ToggleGroup value={[value]} onValueChange={(v) => setValue(v[0])}>

// radix — plain string.
const [value, setValue] = React.useState("normal")
<ToggleGroup type="single" value={value} onValueChange={setValue}>
```

---

## Slider

Base 接受普通 number 表示单个 thumb。Radix 始终要求数组。

**错误（base）：**

```tsx
<Slider defaultValue={[50]} max={100} step={1} />
```

**正确（base）：**

```tsx
<Slider defaultValue={50} max={100} step={1} />
```

**正确（radix）：**

```tsx
<Slider defaultValue={[50]} max={100} step={1} />
```

两者在 range slider 中都使用数组。Base 中受控 `onValueChange` 可能需要类型转换：

```tsx
// base.
const [value, setValue] = React.useState([0.3, 0.7])
<Slider value={value} onValueChange={(v) => setValue(v as number[])} />

// radix.
const [value, setValue] = React.useState([0.3, 0.7])
<Slider value={value} onValueChange={setValue} />
```

---

## Accordion

Radix 要求 `type="single"` 或 `type="multiple"`，并支持 `collapsible`。`defaultValue` 是 string。Base 不使用 `type` prop，使用 `multiple` boolean，且 `defaultValue` 始终是数组。

**错误（base）：**

```tsx
<Accordion type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>
```

**正确（base）：**

```tsx
<Accordion defaultValue={["item-1"]}>
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>

// Multi-select.
<Accordion multiple defaultValue={["item-1", "item-2"]}>
  <AccordionItem value="item-1">...</AccordionItem>
  <AccordionItem value="item-2">...</AccordionItem>
</Accordion>
```

**正确（radix）：**

```tsx
<Accordion type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>
```
