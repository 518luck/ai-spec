// # API 密钥分页配置
// 每页固定展示的密钥条数
// 放在 config segment（无 "use client"），服务端组件与客户端组件都能安全导入，
// 避免 Server Component 从 Client Component 导入常量时被 RSC 替换为客户端引用代理
export const PAGE_SIZE = 10;
