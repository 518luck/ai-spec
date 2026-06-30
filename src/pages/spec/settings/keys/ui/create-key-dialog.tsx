"use client";

import type { JSX } from "react";
import { useState } from "react";
import { toast } from "sonner";

import {
  RESOURCES,
  RESOURCE_KEYS,
  type ResourceKey,
} from "@/shared/lib/api/rbac/resources";
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
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { InfoIcon } from "lucide-react";

// 权限选项及对应的权限范围说明，切换权限时联动展示对应文案
const PERMISSIONS = [
  {
    value: "full",
    label: "全部",
    hint: "此 API 密钥将具有对所有资源的完全访问权限",
  },
  {
    value: "readonly",
    label: "只读",
    hint: "此 API 密钥将只能读取资源，无法进行任何修改",
  },
  {
    value: "restricted",
    label: "限制",
    hint: "此 API 密钥的访问范围将受到限制，仅能访问指定资源",
  },
] as const;

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

type CreateKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// 创建 API 密钥弹窗：密钥归属于个人工作空间，支持名称、权限及限制权限下的资源勾选
export function CreateKeyDialog({
  open,
  onOpenChange,
}: CreateKeyDialogProps): JSX.Element {
  const [name, setName] = useState("");
  const [permission, setPermission] = useState<string>("full");
  const [matrix, setMatrix] = useState<PermissionMatrix>(createEmptyMatrix);

  // 根据当前选中权限取对应的范围说明文案
  const permissionHint =
    PERMISSIONS.find((item) => item.value === permission)?.hint ?? "";

  // 切换权限选项
  const handlePermissionChange = (value: string | null): void => {
    if (value) {
      setPermission(value);
    }
  };

  // 切换某资源的权限粒度（None/Read/Write）
  const handleResourceScopeChange = (
    key: ResourceKey,
    scopeValue: string,
  ): void => {
    setMatrix((prev) => ({ ...prev, [key]: scopeValue }));
  };

  // 弹窗开合处理：关闭时重置表单为初始态，避免下次打开残留上次输入
  const handleOpenChange = (next: boolean): void => {
    if (!next) {
      setName("");
      setPermission("full");
      setMatrix(createEmptyMatrix());
    }
    onOpenChange(next);
  };

  // 本次只做 UI：点击创建仅给出占位提示并关闭弹窗
  const handleCreate = (): void => {
    toast.info("创建功能即将上线");
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* 关闭依赖点击遮罩 / ESC，无需右上角 X，保持弹窗简洁 */}
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">创建 API 密钥</DialogTitle>
          <DialogDescription>
            生成一枚用于程序化接入的密钥，仅归属于你的个人工作空间，创建后请妥善保存。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <KeyFormFields
            name={name}
            permission={permission}
            permissionHint={permissionHint}
            onNameChange={setName}
            onPermissionChange={handlePermissionChange}
          />

          {/* 限制权限下展开资源勾选矩阵，用动画容器平滑过渡展开/收起 */}
          <AnimatedSizeContainer height className="w-full">
            {permission === "restricted" && (
              <PermissionTable
                value={matrix}
                onScopeChange={handleResourceScopeChange}
              />
            )}
          </AnimatedSizeContainer>
        </div>

        <DialogFooter>
          {/* 右上角 X 已承担关闭职责，无需取消按钮；创建按钮铺满底部 */}
          <Button className="w-full" onClick={handleCreate}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type KeyFormFieldsProps = {
  name: string;
  permission: string;
  permissionHint: string;
  onNameChange: (value: string) => void;
  onPermissionChange: (value: string | null) => void;
};

// 密钥名称 + 权限选择（tab 形式） + 权限范围说明，个人与团队空间共用
function KeyFormFields({
  name,
  permission,
  permissionHint,
  onNameChange,
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
        <Label>权限</Label>
        {/* 权限以 tab 形式选择，选中即对应权限，联动下方范围说明与资源勾选 */}
        <Tabs
          value={permission}
          onValueChange={(value) => onPermissionChange(value as string | null)}
        >
          <TabsList className="w-full">
            {PERMISSIONS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-muted-foreground text-xs">{permissionHint}</p>
      </div>
    </div>
  );
}

type PermissionTableProps = {
  value: PermissionMatrix;
  onScopeChange: (key: ResourceKey, scopeValue: string) => void;
};

// 资源权限清单：每行一个资源，右侧 None/Read/Write 单选组，仅「限制」权限下展示
function PermissionTable({
  value,
  onScopeChange,
}: PermissionTableProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      {/* 滚动区域：用 ScrollArea 替代原生 overflow-y-auto，呈现自定义滚动条 */}
      <ScrollArea className="max-h-70 rounded-md">
        <div className="flex w-full flex-col divide-y">
          {RESOURCES.map((resource) => (
            <div
              key={resource.key}
              className="flex items-center justify-between px-3 py-3"
            >
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-sm font-medium whitespace-nowrap">
                  {resource.name}
                </span>
                <InfoTooltip content={resource.description} />
              </div>
              <RadioGroup
                value={value[resource.key]}
                onValueChange={(scopeValue) =>
                  onScopeChange(resource.key, scopeValue as string)
                }
                className="flex w-auto shrink-0 gap-3"
              >
                {RESOURCE_SCOPES.map((scope) => (
                  <Label
                    key={scope.value}
                    className="flex cursor-pointer items-center gap-1.5 text-sm font-normal"
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

type InfoTooltipProps = {
  content: string;
};

// 资源描述气泡：hover 显示资源用途说明
function InfoTooltip({ content }: InfoTooltipProps): JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <InfoIcon className="text-muted-foreground size-3.5 cursor-help" />
        }
      />
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
