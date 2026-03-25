# Checklist - 前端微信小程序优化重构

## Phase 1: 字段对齐

### create-contract 页面
- [x] 删除了 `intermediary_name` 字段
- [x] 删除了 `annual_rent` 字段（使用 `year_rent`）
- [x] 删除了 `items` 数组（转换为 `item_xxx_qty`）
- [x] `status` 默认值正确（不设置，由后端控制）
- [x] 物品清单字段映射正确（fixedItems → item_xxx_qty）

### prepareContractData 方法
- [x] fixedItems 转换为 item_xxx_qty 字段
- [x] 所有字段名与后端数据库一致
- [x] 删除了 `items` 数组发送

## Phase 2: API 接口对齐

### sign-contract 页面
- [x] 甲方签署 API 路径正确（`/sign`）
- [x] 乙方签署 API 路径正确（`/tenant-sign`）
- [x] 请求参数格式正确（`signature` 字段）

### api.js 服务
- [x] 删除了废弃的 API 方法
- [x] API 路径与后端一致

## Phase 3: 页面流程重构

### 删除冗余页面
- [x] 从 app.json 移除了废弃页面
- [x] 删除了废弃页面文件

### contracts 页面
- [x] 合并了 my-contracts 功能
- [x] 状态显示逻辑正确
- [x] 字段映射正确

### contract-detail 页面
- [x] 分享功能正常
- [x] 签署按钮显示正确
- [x] 状态显示正确

### sign-contract 页面
- [x] 支持通过邀请码访问
- [x] 区分甲方/乙方签署
- [x] 签署成功后跳转正确

## Phase 4: 状态显示优化

### 状态枚举映射
- [x] 状态 1 显示"待甲方签署"
- [x] 状态 2 显示"待乙方签署"
- [x] 状态 3 显示"已签署"
- [x] 状态 4 显示"已拒绝"
- [x] 状态 5 显示"已取消"
- [x] 状态 6 显示"已到期"

### 合同列表筛选
- [x] Tab 筛选逻辑正确

## Phase 5: 测试验证

### 完整流程测试
- [x] 创建合同成功
- [x] 甲方签署成功
- [x] 生成邀请码成功
- [x] 乙方签署成功
- [x] 查看合同详情正常
