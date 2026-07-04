"use client";

import copy from "copy-to-clipboard";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type JSX, useState } from "react";
import { toast } from "sonner";

import {
  RESOURCE_KEYS,
  RESOURCES,
  type ResourceKey,
} from "@/shared/lib/ohs/local/appservice/rbac/resources";
import {
  getScopesForResource,
  type Scope,
  type ScopePresetValue,
  scopePresets,
} from "@/shared/lib/ohs/local/appservice/rbac/scopes";
import { createTokenAction } from "@/shared/lib/ohs/local/appservice/token/create-token";
import { tokenNameSchema } from "@/shared/lib/zod/schemas/token";
import { AnimatedSizeContainer } from "@/shared/ui/animated-size-container";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

// 资源权限粒度：None(无)/Read(读)/Write(读写)，单选互斥
const RESOURCE_SCOPES = [
  { value: "", label: "None" },
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
] as const;

// 权限勾选矩阵：每个资源对应一个 scope 值（""/read/write），仅「限制」权限下使用
type PermissionMatrix = Record<ResourceKey, string>;

// 生成全空的权限勾选矩阵，用于初始化与关闭重置
const createEmptyMatrix = (): PermissionMatrix =>
  Object.fromEntries(RESOURCE_KEYS.map((key) => [key, ""])) as PermissionMatrix;

// 把弹窗权限选择翻译成后端可识别的 scope 数组
const buildScopes = (permission: ScopePresetValue, matrix: PermissionMatrix): Scope[] => {
  // 全部 / 只读直接取预设内带的通配 scope
  const presetScopes = scopePresets.find((item) => item.value === permission)?.scopes;
  if (presetScopes && presetScopes.length > 0) return [...presetScopes];

  // 限制权限：按矩阵勾选的资源 + 粒度，从权威表查回对应的 scope
  return RESOURCE_KEYS.flatMap((resource) => {
    const scopeValue = matrix[resource];
    if (scopeValue === "") return [];
    // getScopesForResource 已返回该资源的 read/write scope，按勾选粒度取对应那条
    return getScopesForResource(resource)
      .filter((item) => item.type === scopeValue)
      .map((item) => item.scope);
  });
};

type CreateKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// 创建 API 密钥弹窗：密钥归属于个人工作空间，支持名称、权限及限制权限下的资源勾选
export function CreateKeyDialog({ open, onOpenChange }: CreateKeyDialogProps): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permission, setPermission] = useState<ScopePresetValue>("all_access");
  const [matrix, setMatrix] = useState<PermissionMatrix>(createEmptyMatrix);
  // 创建成功后返回的一次性明文密钥；存在即进入展示态
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // 根据当前选中权限取对应的范围说明文案
  const permissionHint = scopePresets.find((item) => item.value === permission)?.description ?? "";

  const { executeAsync, isPending } = useAction(createTokenAction, {
    onSuccess: ({ data }) => {
      if (!data) return;
      // 明文密钥仅此一次返回，切到展示态让用户复制保存
      setCreatedKey(data.key);
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "创建失败，请稍后重试");
    },
  });

  // 切换权限选项
  const handlePermissionChange = (value: string | null): void => {
    if (value) {
      setPermission(value as ScopePresetValue);
    }
  };

  // 切换某资源的权限粒度（None/Read/Write）
  const handleResourceScopeChange = (key: ResourceKey, scopeValue: string): void => {
    setMatrix((prev) => ({ ...prev, [key]: scopeValue }));
  };

  // 弹窗开合处理：关闭时重置表单为初始态，避免下次打开残留上次输入
  const handleOpenChange = (next: boolean): void => {
    if (!next) {
      setName("");
      setDescription("");
      setPermission("all_access");
      setMatrix(createEmptyMatrix());
      setCreatedKey(null);
    }
    onOpenChange(next);
  };

  // 提交创建：名称用与后端同一份 schema 预校验；限制权限下至少勾选一个资源
  const handleCreate = (): void => {
    const parsed = tokenNameSchema.safeParse(name);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "请输入密钥名称");
      return;
    }
    const scopes = buildScopes(permission, matrix);
    if (permission === "restricted" && scopes.length === 0) {
      toast.error("请至少选择一个资源");
      return;
    }
    void executeAsync({ name: parsed.data, description, scopes });
  };

  // 复制明文密钥到剪贴板（用 copy-to-clipboard 自动处理非 HTTPS / 旧浏览器的回退）
  const handleCopy = (): void => {
    if (!createdKey) return;
    copy(createdKey);
    toast.success("已复制到剪贴板");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        {createdKey ? (
          <CreatedKeyView
            keyValue={createdKey}
            onCopy={handleCopy}
            onDone={() => handleOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">创建 API 密钥</DialogTitle>
              <DialogDescription className="text-sm leading-6">
                生成一枚用于程序化接入的密钥，仅归属于你的个人工作空间，创建后请妥善保存。
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-6 bg-muted px-6 pt-4 pb-0">
              <KeyFormFields
                name={name}
                description={description}
                permission={permission}
                permissionHint={permissionHint}
                onNameChange={setName}
                onDescriptionChange={setDescription}
                onPermissionChange={handlePermissionChange}
              />

              {/* 限制权限下展开资源勾选矩阵，用 tween 线性过渡避免 spring 弹簧的过冲抖动 */}
              <AnimatedSizeContainer
                height
                className="w-full"
                transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
              >
                {permission === "restricted" && (
                  <PermissionTable value={matrix} onScopeChange={handleResourceScopeChange} />
                )}
              </AnimatedSizeContainer>
            </div>

            <DialogFooter>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={isPending}
                aria-busy={isPending}
              >
                {isPending ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// 创建成功后的一次性密钥展示视图：含明文、复制按钮与「关闭后不可再查」警示
function CreatedKeyView({
  keyValue,
  onCopy,
  onDone,
}: {
  keyValue: string;
  onCopy: () => void;
  onDone: () => void;
}): JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg">密钥已创建</DialogTitle>
        <DialogDescription className="leading-6">
          请立即复制保存。关闭后将无法再次查看完整密钥。
        </DialogDescription>
      </DialogHeader>

      <div className="bg-muted px-6 pt-4 pb-0">
        <div className="flex items-center gap-2 rounded-md bg-muted p-3">
          <code className="flex-1 break-all font-mono text-sm">
            {visible ? keyValue : "•".repeat(32)}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "隐藏密钥" : "显示密钥"}
          >
            {visible ? <Icons.eyeOff className="size-4" /> : <Icons.eye className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onCopy} aria-label="复制密钥">
            <Icons.copy className="size-4" />
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button className="w-full" onClick={onDone}>
          完成
        </Button>
      </DialogFooter>
    </>
  );
}

type KeyFormFieldsProps = {
  name: string;
  description: string;
  permission: ScopePresetValue;
  permissionHint: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPermissionChange: (value: string | null) => void;
};

// 密钥名称 + 描述 + 权限选择（tab 形式） + 权限范围说明，个人与团队空间共用
function KeyFormFields({
  name,
  description,
  permission,
  permissionHint,
  onNameChange,
  onDescriptionChange,
  onPermissionChange,
}: KeyFormFieldsProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>密钥名称</Label>
        <Input
          value={name}
          placeholder="例如：读取 Prompt、同步智能体"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>描述（可选）</Label>
        <Textarea
          className="resize-none break-all"
          value={description}
          placeholder="例如：用于本地开发环境"
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>权限</Label>
        {/* 权限以 tab 形式选择，选中即对应权限，联动下方范围说明与资源勾选 */}
        <Tabs
          value={permission}
          onValueChange={(value) => onPermissionChange(value as string | null)}
        >
          <TabsList className="w-full border border-border bg-transparent">
            {scopePresets.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-muted-foreground text-sm">{permissionHint}</p>
      </div>
    </div>
  );
}

type PermissionTableProps = {
  value: PermissionMatrix;
  onScopeChange: (key: ResourceKey, scopeValue: string) => void;
};

// 资源权限清单：每行一个资源，右侧 None/Read/Write 单选组，仅「限制」权限下展示
function PermissionTable({ value, onScopeChange }: PermissionTableProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      {/* 滚动区域：用 ScrollArea 替代原生 overflow-y-auto，呈现自定义滚动条 */}
      <ScrollArea className="max-h-70 rounded-md">
        <div className="flex w-full flex-col divide-y">
          {RESOURCES.map((resource) => (
            <div key={resource.key} className="flex items-center justify-between px-3 py-3">
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="whitespace-nowrap font-medium text-sm">{resource.name}</span>
                <HelpTooltip content={resource.description} />
              </div>
              <RadioGroup
                value={value[resource.key]}
                onValueChange={(scopeValue) => onScopeChange(resource.key, scopeValue as string)}
                className="flex w-auto shrink-0 gap-3"
              >
                {RESOURCE_SCOPES.map((scope) => (
                  <Label
                    key={scope.value}
                    className="flex cursor-pointer items-center gap-1.5 font-normal text-sm"
                  >
                    <RadioGroupItem value={scope.value} />
                    {scope.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
