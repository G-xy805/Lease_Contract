# 后端数据库表单字段与业务逻辑深度分析 Spec

## Why

需要对后端数据库表单字段与业务逻辑进行全面深入的分析，形成完整的技术文档，以便：
1. 理解现有系统数据结构和业务逻辑
2. 为后续功能迭代和优化提供技术依据
3. 确保前后端数据一致性和完整性

## What Changes

- 分析 users 用户表结构与相关业务逻辑
- 分析 contracts 合同表结构与相关业务逻辑
- 分析 contract_inventory 物品清单表结构
- 分析 signatures 电子签名表结构
- 分析 sign_invitations 签署邀请表结构
- 梳理各表之间的关联关系
- 梳理核心业务逻辑流程（合同生命周期、签署流程、用户认证流程）
- 输出完整的数据库分析与业务逻辑文档

## Impact

- 产出文档：数据库深度分析报告.md
- 涉及代码分析：backend/src/models/*.ts, backend/src/controllers/*.ts, backend/src/database.ts

---

## ADDED Requirements

### Requirement: 数据库深度分析报告

系统应生成一份完整的数据库深度分析报告，包含以下内容：

#### Scenario: 用户模块分析
- 深入分析 users 表每个字段的含义、约束、默认值
- 分析用户注册、登录、实名认证的业务流程
- 对比 TypeScript 接口与数据库表结构的差异

#### Scenario: 合同模块分析
- 深入分析 contracts 表每个字段的含义、约束、默认值
- 分析合同创建、修改、签署、取消的业务流程
- 梳理合同状态机与状态流转规则
- 分析支付方式、押金、费用约定等复杂字段

#### Scenario: 物品清单模块分析
- 分析 contract_inventory 表结构
- 分析 26 项物品清单字段设计

#### Scenario: 签名模块分析
- 分析 signatures 电子签名表结构
- 分析 signatures 与 contracts 的关系

#### Scenario: 签署邀请模块分析
- 分析 sign_invitations 表结构
- 分析邀请签署流程与邀请码机制

#### Scenario: 数据库架构分析
- 分析 SQLite 与 MySQL 双数据库支持架构
- 分析数据库迁移机制
- 分析表关系与外键约束

---

## MODIFIED Requirements

无

## REMOVED Requirements

无
