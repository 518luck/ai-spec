// 资源
export const RESOURCE_KEYS = [
  "prompt",
  "agent",
  "tutorial",
  "folder",
  "testSession",
  "user",
] as const;

export type ResourceKey = (typeof RESOURCE_KEYS)[number];

// 元信息
export const RESOURCES: {
  name: string;
  key: ResourceKey;
  description: string;
}[] = [
  {
    key: "prompt",
    name: "提示词",
    description: "用户创建、编辑、发布、删除提示词",
  },
  {
    key: "agent",
    name: "智能体",
    description: "用户创建、编辑、发布、删除智能体",
  },
  {
    key: "tutorial",
    name: "教程",
    description: "用户创建、编辑、发布、删除教程",
  },
  {
    key: "folder",
    name: "文件夹",
    description: "用户创建、编辑、删除文件夹",
  },
  {
    key: "testSession",
    name: "测试会话",
    description: "用户创建、编辑、删除测试会话",
  },
  {
    key: "user",
    name: "用户",
    description: "用户管理",
  },
];
