# Tasks - 前端微信小程序优化重构

## Phase 1: 字段对齐

- [x] Task 1.1: 修复 create-contract 页面字段映射
  - [x] 删除 `intermediary_name` 字段，改用 `partyA_commission`/`partyB_commission`
  - [x] 删除 `annual_rent` 字段，使用 `year_rent`
  - [x] 删除 `items` 数组，转换为 `item_xxx_qty` 字段
  - [x] 修复 `status` 默认值（应为1，不是2）
  - [x] 添加缺失的物品清单字段映射
  - **智能体**: frontend-architect
  - **技能**: 无

- [x] Task 1.2: 更新 prepareContractData 方法
  - [x] 将 fixedItems 数组转换为 item_xxx_qty 字段
  - [x] 确保所有字段名与后端数据库一致
  - **智能体**: frontend-architect
  - **技能**: 无

## Phase 2: API 接口对齐

- [x] Task 2.1: 更新 sign-contract 页面 API 调用
  - [x] 甲方签署：从 `/lessor-sign` 改为 `/sign`
  - [x] 乙方签署：保持 `/tenant-sign`
  - [x] 修复请求参数格式
  - **智能体**: frontend-architect
  - **技能**: 无

- [x] Task 2.2: 更新 api.js 服务
  - [x] 删除废弃的 API 方法
  - [x] 添加新的 API 方法
  - [x] 确保所有 API 路径正确
  - **智能体**: frontend-architect
  - **技能**: 无

## Phase 3: 页面流程重构

- [x] Task 3.1: 删除冗余页面
  - [x] 删除 pages/invitations/index
  - [x] 删除 pages/invite-preview/index
  - [x] 删除 pages/preview-contract/index
  - [x] 删除 pages/reject-contract/index
  - [x] 删除 pages/my-contracts/index
  - [x] 删除 pages/invite-verify/index
  - [x] 更新 app.json 移除这些页面
  - **智能体**: frontend-architect
  - **技能**: 无

- [x] Task 3.2: 优化 contracts 页面
  - [x] 合并 my-contracts 功能
  - [x] 更新状态显示逻辑
  - [x] 更新字段映射
  - **智能体**: frontend-architect
  - **技能**: 无

- [x] Task 3.3: 优化 contract-detail 页面
  - [x] 添加分享功能（生成邀请码）
  - [x] 添加签署按钮
  - [x] 更新状态显示
  - **智能体**: frontend-architect
  - **技能**: 无

- [x] Task 3.4: 优化 sign-contract 页面
  - [x] 支持通过邀请码访问
  - [x] 区分甲方/乙方签署
  - [x] 签署成功后跳转
  - **智能体**: frontend-architect
  - **技能**: 无

## Phase 4: 状态显示优化

- [x] Task 4.1: 更新状态枚举映射
  - [x] 状态 1: 待甲方签署
  - [x] 状态 2: 待乙方签署
  - [x] 状态 3: 已签署
  - [x] 状态 4: 已拒绝
  - [x] 状态 5: 已取消
  - [x] 状态 6: 已到期
  - **智能体**: frontend-architect
  - **技能**: 无

- [x] Task 4.2: 更新合同列表状态筛选
  - [x] Tab: 待甲方签署 (status=1)
  - [x] Tab: 待乙方签署 (status=2)
  - [x] Tab: 已签署 (status=3)
  - **智能体**: frontend-architect
  - **技能**: 无

## Phase 5: 测试验证

- [x] Task 5.1: 完整流程测试
  - [x] 测试创建合同
  - [x] 测试甲方签署
  - [x] 测试分享邀请码
  - [x] 测试乙方签署
  - [x] 测试查看合同详情
  - **智能体**: api-test-pro
  - **技能**: webapp-testing

---

## Task Dependencies

- Task 1.1 独立
- Task 1.2 依赖 Task 1.1
- Task 2.1 依赖 Task 1.2
- Task 2.2 独立
- Task 3.1 独立
- Task 3.2 依赖 Task 3.1
- Task 3.3 依赖 Task 3.2
- Task 3.4 依赖 Task 3.3
- Task 4.1 独立
- Task 4.2 依赖 Task 4.1
- Task 5.1 依赖 Task 1.2, Task 2.1, Task 3.4, Task 4.2

---

## 智能体配置说明

| 智能体类型 | 适用任务 | 说明 |
|-----------|---------|------|
| frontend-architect | Task 1.x, 2.x, 3.x, 4.x | 前端架构专家，负责页面重构、字段映射、API对接 |
| api-test-pro | Task 5.1 | API测试专家，负责完整流程测试 |
| webapp-testing | Task 5.1 | Web应用测试技能，配合API测试 |
