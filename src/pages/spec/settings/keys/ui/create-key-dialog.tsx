"use client";

import type { JSX } from "react";
import { useState } from "react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

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

type CreateKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// 创建 API 密钥弹窗：顶部按个人/团队空间分 tab，团队空间额外多一个工作空间选择
export function CreateKeyDialog({
  open,
  onOpenChange,
}: CreateKeyDialogProps): JSX.Element {
  const [scope, setScope] = useState<"personal" | "team">("personal");
  const [name, setName] = useState("");
  const [permission, setPermission] = useState<string>("full");

  // 根据当前选中权限取对应的范围说明文案
  const permissionHint =
    PERMISSIONS.find((item) => item.value === permission)?.hint ?? "";

  // 切换个人/团队空间 tab
  const handleScopeChange = (value: string | null): void => {
    if (value === "personal" || value === "team") {
      setScope(value);
    }
  };

  // 切换权限选项
  const handlePermissionChange = (value: string | null): void => {
    if (value) {
      setPermission(value);
    }
  };

  // 本次只做 UI：点击创建仅给出占位提示并关闭弹窗
  const handleCreate = (): void => {
    toast.info("创建功能即将上线");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建 API 密钥</DialogTitle>
          <DialogDescription>
            生成一枚用于程序化接入的密钥，创建后请妥善保存。
          </DialogDescription>
        </DialogHeader>

        <Tabs value={scope} onValueChange={handleScopeChange}>
          <TabsList>
            <TabsTrigger value="personal">个人空间</TabsTrigger>
            <TabsTrigger value="team">团队空间</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <KeyFormFields
              name={name}
              permission={permission}
              permissionHint={permissionHint}
              onNameChange={setName}
              onPermissionChange={handlePermissionChange}
            />
          </TabsContent>

          <TabsContent value="team">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>工作空间</Label>
                {/* Workspace 模型未落地，暂以禁用占位呈现，无可选工作空间 */}
                <Select disabled>
                  <SelectTrigger size="sm" className="w-full">
                    <span className="text-muted-foreground">
                      暂无可用工作空间
                    </span>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
              <KeyFormFields
                name={name}
                permission={permission}
                permissionHint={permissionHint}
                onNameChange={setName}
                onPermissionChange={handlePermissionChange}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleCreate}>创建</Button>
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

// 密钥名称 + 权限选择 + 权限范围说明，个人与团队空间共用
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
          placeholder="例如：本地开发、CI 部署"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>权限</Label>
        <Select
          items={PERMISSIONS}
          value={permission}
          onValueChange={onPermissionChange}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PERMISSIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{permissionHint}</p>
      </div>
    </div>
  );
}
