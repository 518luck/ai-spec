# 组件组合

## 目录

- Items 始终放在其 Group 组件内
- Callout 使用 Alert
- 空状态使用 Empty 组件
- Toast 通知使用 sonner
- 在 overlay 组件之间选择
- Dialog、Sheet 和 Drawer 始终需要 Title
- Card 结构
- Button 没有 isPending 或 isLoading prop
- TabsTrigger 必须在 TabsList 内
- Avatar 始终需要 AvatarFallback
- 使用 Separator 替代原始 hr 或 border div
- 使用 Skeleton 作为加载占位
- 使用 Badge 替代自定义样式 span

---

## Items 始终放在其 Group 组件内

绝不要直接在 content container 中渲染 items。

**错误：**

```tsx
<SelectContent>
  <SelectItem value="apple">Apple</SelectItem>
  <SelectItem value="banana">Banana</SelectItem>
</SelectContent>
```

**正确：**

```tsx
<SelectContent>
  <SelectGroup>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
  </SelectGroup>
</SelectContent>
```

这适用于所有基于 group 的组件：

| Item | Group |
|------|-------|
| `SelectItem`, `SelectLabel` | `SelectGroup` |
| `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSub` | `DropdownMenuGroup` |
| `MenubarItem` | `MenubarGroup` |
| `ContextMenuItem` | `ContextMenuGroup` |
| `CommandItem` | `CommandGroup` |

---

## Callout 使用 Alert

```tsx
<Alert>
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>Something needs attention.</AlertDescription>
</Alert>
```

---

## 空状态使用 Empty 组件

```tsx
<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon"><FolderIcon /></EmptyMedia>
    <EmptyTitle>No projects yet</EmptyTitle>
    <EmptyDescription>Get started by creating a new project.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button>Create Project</Button>
  </EmptyContent>
</Empty>
```

---

## Toast 通知使用 sonner

```tsx
import { toast } from "sonner"

toast.success("Changes saved.")
toast.error("Something went wrong.")
toast("File deleted.", {
  action: { label: "Undo", onClick: () => undoDelete() },
})
```

---

## 在 overlay 组件之间选择

| 使用场景 | 组件 |
|----------|-----------|
| 需要输入的专注任务 | `Dialog` |
| 破坏性操作确认 | `AlertDialog` |
| 包含详情或过滤器的侧边面板 | `Sheet` |
| 移动优先的底部面板 | `Drawer` |
| Hover 时显示快速信息 | `HoverCard` |
| 点击时显示小型上下文内容 | `Popover` |

---

## Dialog、Sheet 和 Drawer 始终需要 Title

为保证可访问性，必须提供 `DialogTitle`、`SheetTitle`、`DrawerTitle`。如果视觉上隐藏，使用 `className="sr-only"`。

```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Edit Profile</DialogTitle>
    <DialogDescription>Update your profile.</DialogDescription>
  </DialogHeader>
  ...
</DialogContent>
```

---

## Card 结构

使用完整组合，不要把所有内容都堆进 `CardContent`：

```tsx
<Card>
  <CardHeader>
    <CardTitle>Team Members</CardTitle>
    <CardDescription>Manage your team.</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>
    <Button>Invite</Button>
  </CardFooter>
</Card>
```

---

## Button 没有 isPending 或 isLoading prop

使用 `Spinner` + `data-icon` + `disabled` 组合实现：

```tsx
<Button disabled>
  <Spinner data-icon="inline-start" />
  Saving...
</Button>
```

---

## TabsTrigger 必须在 TabsList 内

绝不要直接在 `Tabs` 中渲染 `TabsTrigger`，始终用 `TabsList` 包裹：

```tsx
<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">...</TabsContent>
</Tabs>
```

---

## Avatar 始终需要 AvatarFallback

始终包含 `AvatarFallback`，用于图片加载失败时展示：

```tsx
<Avatar>
  <AvatarImage src="/avatar.png" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

## 使用现有组件而不是自定义标记

| 替代对象 | 使用 |
|---|---|
| `<hr>` 或 `<div className="border-t">` | `<Separator />` |
| 带样式 div 的 `<div className="animate-pulse">` | `<Skeleton className="h-4 w-3/4" />` |
| `<span className="rounded-full bg-green-100 ...">` | `<Badge variant="secondary">` |
