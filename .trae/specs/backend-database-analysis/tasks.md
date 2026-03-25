# Tasks

## 第一优先级修复（严重问题）

- [x] Task 1: 修复 MySQL init.sql
  - [x] SubTask 1.1: 在 users 表中添加 role VARCHAR(20) 列 ✅
  - [x] SubTask 1.2: 确认 contracts 表字段与 SQLite 版本一致 ✅

- [x] Task 2: 完善数据库迁移 migrateMissingColumns
  - [x] SubTask 2.1: 添加 26 项物品清单字段迁移（item_tv_qty 等）✅
  - [x] SubTask 2.2: 添加 year_rent 字段迁移 ✅
  - [x] SubTask 2.3: 添加 intermediary_name 字段迁移 ✅
  - [x] SubTask 2.4: 添加 lessor_contact、lessee_contact 字段迁移 ✅
  - [x] SubTask 2.5: 添加 partyA_company 字段迁移 ✅
  - [x] SubTask 2.6: 修复 payment_cycle 字段类型（保留VARCHAR兼容）✅
  - [x] SubTask 2.7: 添加缺失字段的索引 ✅

- [x] Task 3: 修复合同总金额计算逻辑
  - [x] SubTask 3.1: 分析当前 calculateTotalAmount 计算逻辑 ✅
  - [x] SubTask 3.2: 根据业务需求修正计算公式（整数运算）✅
  - [x] SubTask 3.3: 确保金额计算精度（使用整数运算）✅

- [x] Task 4: 移除硬编码公司名称
  - [x] SubTask 4.1: 创建配置文件 backend/src/config/contractTemplate.ts ✅
  - [x] SubTask 4.2: 将公司名称移至配置 ✅
  - [x] SubTask 4.3: 修改 contractsController.ts 引用配置 ✅

## 第二优先级修复（中等问题）

- [x] Task 5: 统一 SQLite/MySQL 表结构差异
  - [x] SubTask 5.1: 修复 init-sqlite.sql 添加 lessee_contact（已存在）✅
  - [x] SubTask 5.2: 统一 contracts 表字段顺序和注释 ✅

- [x] Task 6: 增强数据验证
  - [x] SubTask 6.1: 添加身份证号格式验证函数 ✅
  - [x] SubTask 6.2: 添加手机号格式验证函数 ✅
  - [x] SubTask 6.3: 在 contractsController 中添加验证调用 ✅

## 第三优先级修复（优化增强）

- [x] Task 7: 添加缺失字段索引
  - [x] SubTask 7.1: 添加 lessor_phone 索引 ✅
  - [x] SubTask 7.2: 添加 lease_start、lease_end 索引 ✅

# Task Dependencies

- Task 1 独立 ✅
- Task 2 依赖 Task 1 完成后执行 ✅
- Task 3 独立 ✅
- Task 4 依赖 Task 1 完成后执行 ✅
- Task 5 可与 Task 1-4 并行 ✅
- Task 6 独立 ✅
- Task 7 可在 Task 2 完成后执行 ✅

---

## 修复完成总结

| 序号 | 任务 | 状态 | 修改文件 |
|------|------|------|----------|
| 1 | MySQL init.sql 修复 | ✅ | backend/config/init.sql |
| 2 | 数据库迁移完善 | ✅ | backend/src/database.ts |
| 3 | 金额计算修复 | ✅ | backend/src/controllers/contractsController.ts |
| 4 | 配置外部化 | ✅ | backend/src/config/contractTemplate.ts |
| 5 | 表结构统一 | ✅ | 验证无需修改 |
| 6 | 数据验证增强 | ✅ | backend/src/utils/validation.ts |
| 7 | 索引优化 | ✅ | backend/src/database.ts |