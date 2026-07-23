# API 设计规范 v2.0

本接口遵循 RESTful 设计原则，统一返回 JSON 格式。

## 1. 基础约定

请求头必须包含 `Content-Type: application/json`，所有响应均使用 **UTF-8** 编码。

- **GET** - 获取资源
- **POST** - 创建资源
- **PUT** - 全量更新
- **PATCH** - 部分更新
- **DELETE** - 删除资源

## 2. 鉴权机制

鉴权使用 Bearer Token，Token 有效期为 2 小时。

```bash
curl -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
     -H 'Content-Type: application/json' \
     https://api.example.com/v1/users
```

> ⚠️ Token 过期后需调用 `/auth/refresh` 接口刷新， refresh_token 有效期 7 天。

## 3. 分页与排序

分页参数统一为 `page` 和 `pageSize`，默认 `pageSize=20`。

```typescript
interface PaginationParams {
  page: number;      // 页码，从1开始
  pageSize: number;  // 每页数量，最大100
  sortBy?: string;   // 排序字段
  order?: 'asc' | 'desc'; // 排序方向
}
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 20 | 每页数量 |
| sortBy | string | 否 | createdAt | 排序字段 |
| order | string | 否 | desc | asc/desc |

## 4. 错误码规范

错误码采用三段式：**业务模块（2位）+ 错误类型（2位）+ 序号（2位）**。

```json
{
  "code": "100401",
  "message": "用户未授权",
  "details": {
    "field": "token",
    "reason": "Token has expired"
  },
  "requestId": "req_abc123def456"
}
```

### 错误类型对照表

1. `01` - 参数校验错误
1. `02` - 认证/授权错误
1. `03` - 资源不存在
1. `04` - 业务逻辑错误
1. `05` - 第三方服务错误
1. `99` - 系统内部错误

## 5. 响应状态码

所有创建接口需返回 `201`，幂等接口返回 `200`。

- `200 OK` - 请求成功
- `201 Created` - 资源创建成功
- `204 No Content` - 删除成功
- `400 Bad Request` - 参数错误
- `401 Unauthorized` - 未认证
- `403 Forbidden` - 无权限
- `404 Not Found` - 资源不存在
- `429 Too Many Requests` - 请求频率超限
- `500 Internal Server Error` - 服务器错误

---

**注意事项：**

- [ ] 所有接口必须返回 `requestId`
- [ ] 时间字段统一使用 ISO 8601 格式
- [x] 敏感字段禁止在日志中明文输出
- [x] 金额字段使用整数，单位为分

## 6. 代码示例

### TypeScript SDK

```typescript
import { ApiClient, ApiError } from '@example/sdk';

const client = new ApiClient({
  baseURL: 'https://api.example.com/v1',
  timeout: 30000,
  retries: 3,
});

// 创建用户
async function createUser(data: CreateUserRequest): Promise<User> {
  try {
    const response = await client.post('/users', {
      body: data,
      headers: {
        'X-Request-Id': generateRequestId(),
      },
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API Error: ${error.code} - ${error.message}`);
    }
    throw error;
  }
}
```

### Go SDK

```go
package main

import (
    "context"
    "fmt"
    "github.com/example/sdk-go"
)

func main() {
    client := sdk.NewClient(&sdk.Config{
        BaseURL: "https://api.example.com/v1",
        Timeout: 30 * time.Second,
    })
    
    user, err := client.Users.Create(context.Background(), &sdk.CreateUserRequest{
        Name:  "张三",
        Email: "zhangsan@example.com",
    })
    
    if err != nil {
        log.Fatalf("创建用户失败: %v", err)
    }
    
    fmt.Printf("用户ID: %s\n", user.ID)
}
```

## 7. 最佳实践

### 幂等性设计

对于关键业务接口，建议客户端传递 `Idempotency-Key` 头：

```http
POST /v1/orders
Content-Type: application/json
Idempotency-Key: ord_550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer xxx

{
  "items": [
    {"sku": "SKU001", "quantity": 2},
    {"sku": "SKU002", "quantity": 1}
  ],
  "address": "北京市朝阳区xxx路xxx号"
}
```

### 批量操作

批量接口单次最多处理 **100** 条数据，超过需分批处理：

```typescript
async function batchCreateUsers(users: CreateUserRequest[]): Promise<BatchResult> {
  const chunks = chunkArray(users, 100);
  const results: BatchResult[] = [];
  
  for (const chunk of chunks) {
    const result = await client.post('/users/batch', {
      body: { items: chunk },
    });
    results.push(result.data);
  }
  
  return mergeResults(results);
}
```

> 💡 **提示**：批量操作建议使用异步任务模式，通过 WebSocket 或轮询获取执行结果。

## 8. 版本管理

| 版本 | 状态 | 发布日期 | 维护截止 |
|------|------|----------|----------|
| v1 | ✅ 当前版本 | 2024-01-01 | - |
| v0.9 | ⚠️ 过渡期 | 2023-06-01 | 2024-06-01 |
| v0.8 | ❌ 已废弃 | 2022-12-01 | 2023-12-01 |

**版本迁移指南：**

1. 检查 [Changelog](https://docs.example.com/changelog)
1. 使用 `GET /v1/migration/check` 接口检测兼容性
1. 逐步替换旧版本端点
1. 监控错误率和响应时间

---

*最后更新：2024年1月15日*

*文档维护：技术架构组*
