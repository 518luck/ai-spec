## 实现完成！

增量版本管理功能已经实现。以下是完成的内容：

### 📦 新增文件

| 文件                                                                  | 说明                                          |
| --------------------------------------------------------------------- | --------------------------------------------- |
| `src/shared/lib/diff/index.ts`                                        | Diff 工具函数（计算diff、应用diff、重建内容） |
| `app/api/prompt/records/[id]/versions/route.ts`                       | 版本历史列表 API                              |
| `app/api/prompt/records/[id]/versions/[versionId]/route.ts`           | 版本详情 API                                  |
| `app/api/prompt/records/[id]/versions/[versionId]/rollback/route.ts`  | 版本回滚 API                                  |
| `src/entities/prompt/records/api/get-versions.ts`                     | 获取版本列表前端 API                          |
| `src/entities/prompt/records/api/get-version-detail.ts`               | 获取版本详情前端 API                          |
| `src/entities/prompt/records/api/rollback-version.ts`                 | 版本回滚前端 API                              |
| `src/pages/spec/personal/prompt/records/ui/version-history-panel.tsx` | 版本历史面板组件                              |
| `src/pages/spec/personal/prompt/records/ui/version-diff-viewer.tsx`   | 版本对比视图组件                              |

### ✏️ 修改文件

| 文件                                                        | 修改内容                                       |
| ----------------------------------------------------------- | ---------------------------------------------- |
| `prisma/schema/prompt.prisma`                               | 添加增量版本字段（isSnapshot、snapshot、diff） |
| `app/api/prompt/records/[id]/route.ts`                      | PATCH 端点保存时自动创建版本记录               |
| `src/shared/lib/zod/schemas/prompt/record.ts`               | 添加 message 字段到更新入参                    |
| `src/shared/ui/icons.tsx`                                   | 添加 history 图标                              |
| `src/pages/spec/personal/prompt/records/ui/record-card.tsx` | 集成版本历史按钮                               |

### 🎯 功能特性

- ✅ **增量存储**：每 10 个版本存一次快照锚点，其他版本只存 diff
- ✅ **版本历史**：查看版本列表、编辑者信息、版本说明
- ✅ **版本对比**：查看版本内容差异（红色删除、绿色新增）
- ✅ **版本回滚**：回滚到任意历史版本
- ✅ **自动记录**：编辑收录时自动创建版本记录

### 🚀 使用方式

1. 编辑收录时，会自动保存版本记录
2. 在收录卡片右下角点击时钟图标打开版本历史面板
3. 点击"查看差异"查看版本内容变化
4. 点击"回滚"恢复到该版本
