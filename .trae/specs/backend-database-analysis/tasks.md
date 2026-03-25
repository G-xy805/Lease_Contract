# Tasks

- [x] Task 1: 分析 users 用户表与业务逻辑
  - [x] SubTask 1.1: 分析 users 表字段结构
  - [x] SubTask 1.2: 分析用户注册/登录/实名认证流程
  - [x] SubTask 1.3: 对比 IContract 接口与数据库表结构

- [x] Task 2: 分析 contracts 合同表与业务逻辑
  - [x] SubTask 2.1: 分析 contracts 表所有字段
  - [x] SubTask 2.2: 分析合同状态机与状态流转
  - [x] SubTask 2.3: 分析合同创建/修改/签署/取消流程
  - [x] SubTask 2.4: 分析支付方式与押金计算逻辑

- [x] Task 3: 分析 contract_inventory 物品清单表
  - [x] SubTask 3.1: 分析物品清单表结构
  - [x] SubTask 3.2: 分析 26 项物品字段设计

- [x] Task 4: 分析 signatures 电子签名表
  - [x] SubTask 4.1: 分析签名表结构
  - [x] SubTask 4.2: 分析签名与合同关系

- [x] Task 5: 分析 sign_invitations 签署邀请表
  - [x] SubTask 5.1: 分析邀请表结构
  - [x] SubTask 5.2: 分析邀请签署流程与邀请码机制

- [x] Task 6: 分析数据库架构
  - [x] SubTask 6.1: 分析 SQLite/MySQL 双数据库架构
  - [x] SubTask 6.2: 分析数据库迁移机制
  - [x] SubTask 6.3: 梳理表关系与外键

- [x] Task 7: 生成完整分析报告文档

# Task Dependencies

- Task 1 ~ Task 6 可并行执行（相互独立）
- Task 7 依赖 Task 1 ~ Task 6 完成后执行
