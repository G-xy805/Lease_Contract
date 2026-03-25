# 房屋租赁合同线上签署系统 - 开发规格说明书

## Why
需要开发一套房屋租赁合同线上签署系统，实现合同的在线创建、填写、签署和管理功能。传统的纸质合同签署流程繁琐、效率低下，无法满足现代房屋租赁业务的需求。通过数字化方式，可以大幅提升合同签署效率，降低管理成本，并确保合同的安全性和可追溯性。

## What Changes
- 开发微信小程序客户端（前端）
- 开发后端API服务
- 设计数据库模型和数据存储方案
- 实现用户身份认证和电子签名功能
- 实现合同全生命周期管理

## Impact
- Affected specs: 房屋租赁合同线上签署系统
- Affected code:
  - 微信小程序前端：`/miniprogram/`
  - 后端服务：`/backend/`

## Development Mode
**当前阶段：本地开发**
- 所有开发工作在本地环境进行
- 后端服务运行在本地（localhost）
- 数据库使用本地MySQL
- 文件存储使用本地存储
- 小程序使用微信开发者工具进行本地调试
- **部署上线相关任务（Phase 4）延后处理**

## System Architecture

### Technology Stack

**前端（微信小程序）**
- 开发框架：微信小程序原生框架
- 开发语言：TypeScript/JavaScript
- UI方案：Vant Weapp UI组件库（推荐）；纯原生组件（备选）
- 签名组件：自定义手写签名组件（Canvas）

**后端**
- 运行框架：Node.js + Express/Koa
- 开发语言：TypeScript/JavaScript
- 数据库：MySQL（本地）
- 文件存储：本地存储（开发阶段）
- 电子签章：第三方电子签章API（如e签宝、法大大）- 可后续集成

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      微信小程序用户端                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  首页   │  │ 合同列表 │  │ 合同详情 │  │  我的   │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                           │ HTTPS API (localhost:3000)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端API服务（本地）                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ 用户模块 │  │ 合同模块 │  │签署模块 │  │ 文件模块 │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       ┌──────────┐               ┌──────────┐
       │  MySQL   │               │ 本地文件  │
       │ （本地）  │               │ 存储      │
       └──────────┘               └──────────┘
```

## Business Flow

### Complete Signing Process
```
┌─────────────────────────────────────────────────────────────────────┐
│                        合同签署完整流程                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【甲方操作】（出租方）                                                │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐         │
│  │ 登录/  │───▶│ 实名认证 │───▶│ 创建合同 │───▶│ 填写合同 │         │
│  │ 注册   │    │ (必填)   │    │         │    │ 信息    │         │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘         │
│                                                     │               │
│                                                     ▼               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐         │
│  │ 合同状态│◀───│ 甲方签署 │◀───│ 预览合同 │◀───│ 确认合同 │         │
│  │ 变为    │    │ 电子签   │    │         │    │ 内容    │         │
│  │ 待乙方签│    │         │    │         │    │         │         │
│  └────┬────┘    └─────────┘    └─────────┘    └─────────┘         │
│       │                                                           │
│       │ 发送签署邀请（短信/微信）                                    │
│       ▼                                                           │
│  【乙方操作】（承租方）                                                │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐         │
│  │ 收到    │───▶│ 登录/  │───▶│ 实名认证 │───▶│ 预览合同 │         │
│  │ 签署通知│    │ 注册   │    │ (必填)   │    │ 内容    │         │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘         │
│                                                     │               │
│                                                     ▼               │
│                                          ┌─────────────────┐       │
│                                          │ 同意并签署/拒绝  │       │
│                                          └────────┬────────┘       │
│                                                   │                │
│                           ┌───────────────────────┴──────┐         │
│                           ▼                              ▼         │
│                  ┌─────────────┐                ┌─────────────┐  │
│                  │ 签署完成    │                │ 拒绝签署    │  │
│                  │ 合同生效    │                │ 合同终止    │  │
│                  └─────────────┘                └─────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Contract Status Flow
```
draft ──▶ pending_landlord_sign ──▶ pending_tenant_sign ──▶ signed
  │              │                        │
  │              │                        │
  ▼              ▼                        ▼
cancelled    cancelled                 cancelled
                                    (rejected by tenant)
```

## User Roles

### Role Definition
系统中的用户分为两种角色：

| 角色 | 说明 | 主要操作 |
|------|------|----------|
| **甲方（Landlord）** | 出租方/房东 | 创建合同、编辑合同、签署合同、取消合同、查看签署状态 |
| **乙方（Tenant）** | 承租方/租客 | 预览合同内容、签署合同、拒绝签署、查看已签署合同 |

### Role Identification
- 用户角色通过手机号或openid与合同的关联来确定
- 同一用户在不同合同中可能扮演不同角色
- **甲方**：创建合同的用户
- **乙方**：收到签署邀请并接受的用户

## Mini-Program Pages

### 甲方页面（出租方）
| 页面 | 路径 | 说明 |
|------|------|------|
| 首页（甲方视角） | /pages/index/index | 合同快捷入口、甲方操作概览 |
| 我的合同（甲方） | /pages/contracts/index | 我创建的合同列表 |
| 创建合同 | /pages/create-contract/index | 填写合同信息 |
| 合同预览（甲方） | /pages/preview-contract/index | 预览并确认合同 |
| 合同签署（甲方） | /pages/sign-contract/index | 甲方电子签名 |
| 合同详情（甲方） | /pages/contract-detail/index | 查看合同完整信息 |
| 个人中心 | /pages/profile/index | 用户信息管理 |

### 乙方页面（承租方）
| 页面 | 路径 | 说明 |
|------|------|------|
| 首页（乙方视角） | /pages/index/index | 签署邀请入口、乙方操作概览 |
| 收到的签署 | /pages/invitations/index | 待签署的合同邀请列表 |
| 签署预览 | /pages/invite-preview/index | 查看甲方发来的合同内容 |
| 合同签署（乙方） | /pages/sign-contract/index | 乙方电子签名 |
| 拒绝签署 | /pages/reject-contract/index | 拒绝签署并填写原因 |
| 我的合同（乙方） | /pages/my-contracts/index | 我签署的合同列表 |
| 合同详情（乙方） | /pages/contract-detail/index | 查看合同完整信息 |
| 个人中心 | /pages/profile/index | 用户信息管理 |

### 通用页面
| 页面 | 路径 | 说明 |
|------|------|------|
| 登录 | /pages/login/index | 微信登录/手机号登录 |
| 实名认证 | /pages/real-name/index | 身份证认证、人脸核身 |

### Page Navigation Logic
```
┌─────────────────────────────────────────────────────────────┐
│                       用户打开小程序                           │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    检查登录状态                              │
│            未登录 ──▶ 登录页 ──▶ 实名认证 ──▶ 首页         │
└───────────────────────────┬─────────────────────────────────┘
                            ▼ 已登录
┌─────────────────────────────────────────────────────────────┐
│                     首页（根据角色显示不同内容）               │
├─────────────────────────────────────────────────────────────┤
│ 甲方视角：                    │ 乙方视角：                   │
│ - 创建新合同入口              │ - 收到的签署邀请              │
│ - 我创建的合同                │ - 待签署列表                  │
│ - 草稿/待签署/已签署统计       │ - 已签署合同                  │
└─────────────────────────────────────────────────────────────┘
```

## ADDED Requirements

### Requirement: 用户注册与登录
系统 SHALL 提供用户注册和登录功能：
- 支持手机号+验证码登录
- 支持微信一键登录
- 用户首次登录自动创建账号
- JWT Token 认证

### Requirement: 实名认证
系统 SHALL 提供实名认证功能：
- 签署合同前必须完成实名认证
- 支持身份证OCR识别
- 支持人脸核身验证
- 实名认证状态持久化保存

#### Scenario: 未认证用户尝试签署
- **WHEN** 用户点击签署按钮但未完成实名认证
- **THEN** 系统引导用户完成实名认证后方可签署

### Requirement: 合同创建（甲方）
系统 SHALL 提供甲方创建合同功能：
- 填写甲乙双方基本信息
- 填写房屋和租赁信息
- 填写租金和押金信息
- 填写物品清单
- 支持合同预览
- 支持保存草稿

#### Scenario: 甲方创建合同
- **WHEN** 甲方点击"创建合同"按钮
- **THEN** 系统展示空白合同模板供甲方填写

### Requirement: 甲方签署
系统 SHALL 提供甲方签署功能：
- 甲方确认合同内容无误后进行电子签名
- 签署后合同状态变为"待乙方签署"
- 系统自动发送签署邀请给乙方

#### Scenario: 甲方签署合同
- **WHEN** 甲方点击"立即签署"按钮
- **THEN** 系统展示签名区域，甲方完成签名后提交

### Requirement: 签署邀请通知
系统 SHALL 提供签署邀请通知功能：
- 甲方签署完成后发送签署邀请给乙方（本地开发阶段可使用模拟通知）
- 通知内容包含合同概要和签署链接
- 支持签署链接有效期设置

#### Scenario: 发送签署邀请
- **WHEN** 甲方完成签署
- **THEN** 系统向乙方发送签署邀请

### Requirement: 乙方预览合同
系统 SHALL 提供乙方预览合同功能：
- 乙方收到签署邀请后可以查看合同完整内容
- 支持在线预览合同
- 支持下载合同PDF

#### Scenario: 乙方查看合同
- **WHEN** 乙方点击签署邀请链接进入小程序
- **THEN** 系统展示合同完整内容供乙方查看

### Requirement: 乙方签署或拒绝
系统 SHALL 提供乙方操作功能：
- 乙方可以同意并签署合同
- 乙方可以拒绝签署（需填写拒绝原因）
- 签署后合同状态变为"已签署"
- 拒绝后合同状态变为"已终止"

#### Scenario: 乙方签署合同
- **WHEN** 乙方确认合同内容无误并点击"同意签署"
- **THEN** 系统展示签名区域，乙方完成签名后提交

#### Scenario: 乙方拒绝签署
- **WHEN** 乙方点击"拒绝签署"按钮
- **THEN** 系统要求乙方填写拒绝原因，确认后合同终止

### Requirement: 签署过程留痕
系统 SHALL 记录完整的签署过程信息：
- 签署时间（精确到秒）
- 签署IP地址
- 签署设备信息
- 签署时的地理位置（可选）

### Requirement: 合同归档与验证
系统 SHALL 提供合同归档功能：
- 签署完成后自动生成完整合同PDF
- 合同包含所有签署信息和水印
- 提供合同验证码可通过链接验证合同真伪
- 双方均可查看和下载已签署合同

### Requirement: 签署完成通知
系统 SHALL 在签署完成后发送通知：
- 签署完成后自动通知甲方（合同已签署）
- 通知双方签署已完成，合同正式生效

## MODIFIED Requirements

### Requirement: 现有HTML模板字段映射
将 [lease_contract_template.html](d:\Pro\Lease_Contract\lease_contract_template.html) 中的所有可编辑字段映射为系统字段：

| HTML字段ID | 字段名称 | 字段类型 | 验证规则 |
|-----------|---------|---------|---------|
| party_b_name | 乙方姓名 | string | 必填，2-20字符 |
| party_b_idcard | 乙方身份证号 | string | 必填，18位身份证号 |
| party_b_phone | 乙方联系电话 | string | 必填，11位手机号 |
| party_b_agent | 乙方委托代理人 | string | 可选 |
| property_location | 房产位置 | string | 必填 |
| property_area | 建筑面积 | number | 必填，正数 |
| lease_start | 租赁开始日期 | date | 必填 |
| lease_end | 租赁结束日期 | date | 必填 |
| lease_months | 租赁月数 | number | 必填，正整数 |
| lease_purpose | 租赁用途 | string | 必填 |
| monthly_rent | 月租金 | number | 必填，正数 |
| annual_rent | 年租金 | number | 必填，正数 |
| rent_payment_type | 租金支付方式 | enum | 必填，月付/季付/半年/年付 |
| rent_notice_days | 提前通知天数 | number | 必填，正整数 |
| deposit_cn | 押金大写 | string | 必填 |
| deposit_num | 押金小写 | number | 必填，正数 |
| payment_times | 付款次数 | number | 必填，正整数 |
| first_payment | 第一次支付金额 | number | 必填，正数 |
| second_payment | 第二次支付金额 | number | 可选 |
| second_payment_time | 第二次支付时间 | date | 可选 |
| bank_account | 甲方收款账户 | string | 必填 |
| agency_fee_landlord | 甲方佣金 | number | 可选 |
| agency_fee_tenant | 乙方佣金 | number | 可选 |
| items_table | 物品清单 | table | 包含物品名称、数量、单位 |
| meter_readings | 仪表读数 | object | 电表、水表、煤气表 |
| extra_terms | 其他约定事项 | string | 可选 |

## REMOVED Requirements
无

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  openid VARCHAR(128) UNIQUE,
  phone VARCHAR(11) UNIQUE,
  name VARCHAR(50),
  idcard VARCHAR(18),
  idcard_front VARCHAR(255),
  idcard_back VARCHAR(255),
  real_name_status ENUM('none', 'pending', 'verified', 'failed') DEFAULT 'none',
  real_name_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Contracts Table
```sql
CREATE TABLE contracts (
  id VARCHAR(36) PRIMARY KEY,
  template_id VARCHAR(36),
  status ENUM('draft', 'pending_landlord_sign', 'pending_tenant_sign', 'signed', 'rejected', 'expired', 'cancelled') DEFAULT 'draft',
  landlord_id VARCHAR(36),
  tenant_id VARCHAR(36),
  tenant_phone VARCHAR(11),
  tenant_name VARCHAR(50),
  property_location VARCHAR(255),
  property_area DECIMAL(10,2),
  lease_start DATE,
  lease_end DATE,
  lease_months INT,
  lease_purpose VARCHAR(100),
  monthly_rent DECIMAL(10,2),
  annual_rent DECIMAL(10,2),
  rent_payment_type ENUM('monthly', 'quarterly', 'semi_annually', 'annually'),
  deposit_cn VARCHAR(50),
  deposit_num DECIMAL(10,2),
  bank_account VARCHAR(100),
  extra_terms TEXT,
  reject_reason TEXT,
  pdf_url VARCHAR(255),
  contract_code VARCHAR(50) UNIQUE,
  sign_expire_at TIMESTAMP,
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id)
);
```

### Contract Payments Table
```sql
CREATE TABLE contract_payments (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36),
  payment_no INT,
  amount DECIMAL(10,2),
  due_date DATE,
  paid_at DATE,
  status ENUM('unpaid', 'paid', 'overdue') DEFAULT 'unpaid',
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);
```

### Contract Items Table
```sql
CREATE TABLE contract_items (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36),
  item_name VARCHAR(100),
  quantity DECIMAL(10,2),
  unit VARCHAR(20),
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);
```

### Signatures Table
```sql
CREATE TABLE signatures (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36),
  user_id VARCHAR(36),
  sign_type ENUM('signature', 'seal') DEFAULT 'signature',
  sign_role ENUM('landlord', 'tenant') NOT NULL,
  sign_image VARCHAR(255),
  sign_data TEXT,
  sign_ip VARCHAR(50),
  sign_device VARCHAR(100),
  sign_location VARCHAR(100),
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Sign Invitations Table
```sql
CREATE TABLE sign_invitations (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) NOT NULL,
  invitee_phone VARCHAR(11) NOT NULL,
  invitee_name VARCHAR(50),
  invite_code VARCHAR(20) UNIQUE,
  status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
  expire_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);
```

## API Endpoints

### 用户模块
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users/wechat-login | 微信登录 |
| POST | /api/users/phone-login | 手机号登录 |
| POST | /api/users/send-code | 发送验证码 |
| GET | /api/users/profile | 获取用户信息 |
| PUT | /api/users/profile | 更新用户信息 |
| POST | /api/users/real-name/verify | 实名认证 |

### 合同模块（甲方）
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contracts/landlord | 获取甲方创建的合同列表 |
| GET | /api/contracts/:id | 获取合同详情 |
| POST | /api/contracts | 创建合同（甲方） |
| PUT | /api/contracts/:id | 更新合同（草稿状态） |
| DELETE | /api/contracts/:id | 删除合同（草稿） |
| POST | /api/contracts/:id/submit | 提交合同（甲方签署） |
| GET | /api/contracts/:id/pdf | 生成PDF |

### 合同模块（乙方）
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contracts/tenant | 获取乙方签署的合同列表 |
| GET | /api/invitations | 获取收到的签署邀请列表 |
| GET | /api/invitations/:code | 通过邀请码获取合同信息 |
| POST | /api/invitations/:code/accept | 接受邀请（乙方） |
| POST | /api/contracts/:id/reject | 拒绝签署（乙方） |

### 合同状态与验证
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contracts/verify/:code | 验证合同真伪 |

### 签署模块
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/signatures | 创建签署记录 |
| GET | /api/signatures/:contract_id | 获取签署记录 |

### 文件模块
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/upload/image | 上传图片 |
| POST | /api/upload/file | 上传文件 |

### 通知模块
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/notifications/send-sign-invite | 发送签署邀请通知 |
| POST | /api/notifications/send-sign-complete | 发送签署完成通知 |

## Deployment Cost Analysis

### 生产环境部署成本分析

#### 方案一：轻量级部署（低成本）
| 项目 | 服务商 | 配置 | 月费用 | 年费用 | 备注 |
|------|--------|------|--------|--------|------|
| 云服务器 | 阿里云/腾讯云 | 1核2G 1M带宽 | ¥30-50 | ¥360-600 | 最低配置，仅支持小规模用户 |
| 云数据库 | 阿里云/腾讯云 | 1G内存 20G硬盘 | ¥20-30 | ¥240-360 | MySQL基础版 |
| 对象存储 | 阿里云OSS | 40GB存储 1GB流量/月 | ¥10 | ¥120 | 文件存储 |
| 域名 | 阿里云/腾讯云 | .com域名 | ¥30-50 | ¥30-50 | 首年 |
| HTTPS证书 | Let's Encrypt | 免费SSL | ¥0 | ¥0 | 自动续期 |
| **总计** | | | **¥90-140/月** | **¥730-1130/年** |

#### 方案二：标准部署（推荐）
| 项目 | 服务商 | 配置 | 月费用 | 年费用 | 备注 |
|------|--------|------|--------|--------|------|
| 云服务器 | 阿里云/腾讯云 | 2核4G 3M带宽 | ¥80-120 | ¥960-1440 | 可支持500-1000并发 |
| 云数据库 | 阿里云/腾讯云 | 2G内存 50G硬盘 | ¥50-80 | ¥600-960 | MySQL高可用版 |
| 对象存储 | 阿里云OSS | 100GB存储 10GB流量/月 | ¥20 | ¥240 | 足够合同文件存储 |
| 短信服务 | 阿里云/腾讯云 | 500条/月 | ¥15-30 | ¥180-360 | 签署通知 |
| 域名 | 阿里云/腾讯云 | .com域名 | ¥30-50 | ¥30-50 | 首年 |
| HTTPS证书 | Let's Encrypt | 免费SSL | ¥0 | ¥0 | 自动续期 |
| **总计** | | | **¥195-300/月** | **¥2010-3050/年** |

#### 方案三：企业级部署
| 项目 | 服务商 | 配置 | 月费用 | 年费用 | 备注 |
|------|--------|------|--------|--------|------|
| 云服务器 | 阿里云/腾讯云 | 4核8G 5M带宽 | ¥200-300 | ¥2400-3600 | 高性能 |
| 云数据库 | 阿里云/腾讯云 | 4G内存 100G硬盘 | ¥150-200 | ¥1800-2400 | MySQL集群版 |
| 对象存储 | 阿里云OSS | 500GB存储 50GB流量/月 | ¥50 | ¥600 | 大量文件存储 |
| 短信服务 | 阿里云/腾讯云 | 2000条/月 | ¥50-80 | ¥600-960 | 足够业务使用 |
| SSL证书 | 阿里云/腾讯云 | 企业级OV证书 | ¥1500-3000/年 | ¥1500-3000 | 需企业认证 |
| 域名 | 阿里云/腾讯云 | .com域名 | ¥30-50 | ¥30-50 | 首年 |
| 电子签章 | e签宝/法大大 | API调用 | ¥0.5-2/次 | 按量付费 | 看业务量 |
| **总计** | | | **¥480-630/月** | **¥6930-9710/年** |

### 第三方服务说明

#### 电子签章服务（可选）
| 服务商 | 收费方式 | 费用 |
|--------|----------|------|
| e签宝 | API调用 | ¥0.5-2/次签署 |
| 法大大 | API调用 | ¥0.5-2/次签署 |
| 腾讯电子签 | API调用 | ¥0.3-1/次签署 |
| 自建（本地） | 一次性 | ¥0，但无法律效力 |

> **注意**：如仅需内部使用，手写签名可本地实现；如需法律效力，建议接入第三方电子签章服务。

#### 实名认证服务（可选）
| 服务商 | 收费方式 | 费用 |
|--------|----------|------|
| 阿里云实人认证 | API调用 | ¥0.1-0.5/次 |
| 腾讯云实名认证 | API调用 | ¥0.1-0.3/次 |
| 微信小程序云开发 | 资源包 | ¥0/次（有限额） |

### 成本优化建议

1. **初期用户量少时**：选择方案一，¥90-140/月即可运行
2. **业务增长后**：平滑升级到方案二
3. **电子签章**：初期可使用本地签名（无法律效力），后期接入第三方
4. **短信通知**：初期可使用微信订阅消息（免费），后期再加短信
5. **SSL证书**：使用Let's Encrypt免费证书即可

### 总体成本评估
- **最低成本**：¥730/年（仅服务器+数据库+存储）
- **推荐成本**：¥2010-3050/年（标准配置）
- **企业级成本**：¥7000-10000/年（高可用+电子签章）
