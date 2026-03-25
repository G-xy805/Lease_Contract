# 后端数据库问题修复实施 Spec

## Why

根据数据库问题分析报告，对后端项目进行系统性修复，解决已识别的严重问题，提升系统稳定性、数据一致性和运行效率。

## What Changes

### 第一优先级修复（严重问题）✅ 已完成
1. 修复 MySQL init.sql - 添加缺失的 role 列
2. 完善数据库迁移 - 补全所有缺失字段（26项物品清单、year_rent、intermediary_name等）
3. 修复合同总金额计算逻辑 - 明确业务需求并修正 calculateTotalAmount
4. 移除硬编码公司名称 - 改为从配置文件读取

### 第二优先级修复（中等问题）✅ 已完成
5. 统一 payment_cycle 字段类型 - 修复迁移中的 VARCHAR(20) 错误
6. 修复 SQLite/MySQL 表结构差异 - lessee_contact 等字段
7. 统一索引创建逻辑

### 第三优先级修复（优化增强）✅ 已完成
8. 增强数据验证 - 身份证号、手机号格式校验
9. 优化金额计算精度 - 使用精确计算方法
10. 添加缺失字段的数据库索引

## Impact

修改文件：
- backend/config/init.sql ✅
- backend/src/database.ts ✅
- backend/src/controllers/contractsController.ts ✅
- backend/src/config/contractTemplate.ts ✅ (新建)
- backend/src/utils/validation.ts ✅ (新建)

---

## 修复完成状态

### Requirement: MySQL初始化脚本修复 ✅

#### Scenario: role列修复
- **WHEN** 使用 MySQL 数据库初始化时
- **THEN** users 表包含 role VARCHAR(20) 列

### Requirement: 数据库迁移完整性 ✅

#### Scenario: 物品清单字段迁移
- **WHEN** 执行数据库迁移时
- **THEN** 26项物品清单字段（item_tv_qty 等）被添加

#### Scenario: 其他字段迁移
- **WHEN** 执行数据库迁移时
- **THEN** year_rent、intermediary_name、lessor_contact、lessee_contact 等字段被添加

### Requirement: 合同金额计算修复 ✅

#### Scenario: 总金额计算
- **WHEN** 创建合同时
- **THEN** 使用整数运算避免浮点数精度问题

### Requirement: 配置外部化 ✅

#### Scenario: 公司名称配置
- **WHEN** 创建合同或生成 PDF 时
- **THEN** partyA_company 从配置文件读取

### Requirement: 数据验证增强 ✅

#### Scenario: 身份证号验证
- **WHEN** 用户提交包含身份证号的请求时
- **THEN** 后端验证身份证号格式（18位，最后一位可为X）

#### Scenario: 手机号验证
- **WHEN** 用户提交包含手机号的请求时
- **THEN** 后端验证手机号格式（11位，以1开头）

---

## MODIFIED Requirements

无

## REMOVED Requirements

无

---

*修复完成时间: 2026-03-25*