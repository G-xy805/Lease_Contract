# 房屋租赁合同线上签署 - 数据库优化方案

## 一、需求背景

### 现有问题

1. **过度设计**：数据库表结构过于复杂，包含物品清单表、付款记录表、合同条款表等，但实际仅需线上签署功能
2. **字段冗余**：合同表字段过多，部分字段可简化或合并
3. **规范化不足**：甲乙双方信息未分离，导致数据冗余和维护困难
4. **模板不匹配**：数据库字段与合同模板占位符不对应

### 核心需求

1. **用户角色**：甲方（出租方）、乙方（承租方）
2. **签署流程**：甲方创建合同 → 甲方签署 → 微信分享给乙方 → 乙方登录签署
3. **合同管理**：仅查看和终止（无变更、续租功能）
4. **签署方式**：双方电子签署
5. **房屋信息**：不需要单独的房源管理，仅合同中包含地址信息
6. **支付管理**：不需要在线支付功能
7. **物品清单**：需要存储26项物品数量
8. **丙方信息**：保留丙方字段但非必填

---

## 二、设计原则

1. **简化优先**：删除不必要的表结构，只保留核心签署功能所需的数据
2. **合同为主**：以合同为核心，用户信息围绕合同展开
3. **灵活扩展**：预留字段应对未来可能的变更需求
4. **分离签署状态**：清晰区分甲方签署状态和乙方签署状态
5. **模板匹配**：数据库字段与合同模板占位符一一对应

---

## 三、数据库结构

### 3.1 users（用户表）

存储用户基本信息，用户通过微信或手机号登录。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 用户ID |
| openid | VARCHAR(64) | DEFAULT NULL | 微信openid |
| phone | VARCHAR(20) | NOT NULL, UNIQUE | 手机号（登录账号） |
| name | VARCHAR(50) | DEFAULT NULL | 姓名 |
| idcard | VARCHAR(18) | DEFAULT NULL | 身份证号 |
| idcard_front | VARCHAR(255) | DEFAULT NULL | 身份证正面照片路径 |
| idcard_back | VARCHAR(255) | DEFAULT NULL | 身份证背面照片路径 |
| real_name_status | INTEGER | DEFAULT 0 | 实名认证状态（0:未认证, 1:已认证） |
| real_name_at | DATETIME | DEFAULT NULL | 实名认证时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**：

- `idx_users_phone` ON `users(phone)`
- `idx_users_openid` ON `users(openid)`

---

### 3.2 contracts（合同主表）

存储租赁合同的完整信息，与 `lease_contract_template.html` 模板占位符一一对应。

**完整字段列表（93个字段）**：

| 分类 | 字段 |
|------|------|
| 基本信息 | id, contract_no, title |
| 甲方信息 | lessor_user_id, lessor_name, lessor_phone, lessor_phone2, lessor_idcard, lessor_account, lessor_contact, partyA_company |
| 乙方信息 | lessee_name, lessee_phone, lessee_idcard, lessee_contact |
| 房屋信息 | house_address, house_area, rent_purpose |
| 租赁期限 | lease_start, lease_end, lease_months, advance_notice_days |
| 租金信息 | monthly_rent, year_rent, payment_method, payment_cycle, payment_count, first_payment_amount, first_payment_date, second_payment_amount, second_payment_date, third_payment_amount, third_payment_date |
| 押金 | deposit, deposit_chinese |
| 费用约定 | fee_water, fee_electric, fee_gas, fee_tv, fee_network, fee_property, fee_heating |
| 居间服务 | partyA_commission, partyA_commission_chinese, partyB_commission, partyB_commission_chinese |
| 水电表 | electricity_meter, water_meter, gas_meter |
| 物品清单（24项） | item_tv_qty, item_wardrobe_qty, item_tv_remote_qty, ... |
| 签署状态 | lessor_sign_status, lessee_sign_status, lessor_signed_at, lessee_signed_at, lessor_signature, lessee_signature, sign_date |
| 合同状态 | status, reject_reason, effective_at, expires_at |
| 签署邀请 | invite_code, invite_expires_at |
| 合同文档 | contract_pdf_path |
| 元数据 | created_by, created_at, updated_at |

---

## 四、合同状态说明

| 状态值 | 常量名 | 说明 |
|--------|--------|------|
| 1 | PENDING_LESSOR_SIGN | 待甲方签署 |
| 2 | PENDING_LESSEE_SIGN | 待乙方签署 |
| 3 | SIGNED | 已签署（生效） |
| 4 | REJECTED | 已拒绝 |
| 5 | CANCELLED | 已取消 |
| 6 | EXPIRED | 已到期 |

---

## 五、签署流程

```
步骤1: 甲方创建合同
  - 甲方填写合同信息（房屋、租金、期限、物品清单等）
  - status = 1 (PENDING_LESSOR_SIGN)

步骤2: 甲方签署合同
  - 甲方进行签名
  - lessor_sign_status = 1, lessor_signed_at, lessor_signature
  - status = 2 (PENDING_LESSEE_SIGN)
  - 生成 invite_code（格式：LC{年月日}{6位随机字符}）
  - 设置 invite_expires_at（签署后7天）

步骤3: 甲方分享给乙方
  - 生成签署链接: /pages/sign-contract?code={invite_code}
  - 生成二维码

步骤4: 乙方登录/注册
  - 乙方点击链接进入
  - 手机号验证登录

步骤5: 乙方签署合同
  - 乙方确认合同内容
  - lessee_sign_status = 1, lessee_signed_at, lessee_signature, sign_date
  - status = 3 (SIGNED)
  - 设置 effective_at
  - 生成 contract_pdf_path

步骤6: 双方查看/下载合同
```

---

## 六、API 接口

### 6.1 合同相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/contracts | 创建合同 |
| GET | /api/contracts/:id | 获取合同详情 |
| GET | /api/contracts | 合同列表 |
| PUT | /api/contracts/:id | 更新合同 |

### 6.2 签署相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/contracts/:id/sign | 甲方签署 |
| POST | /api/contracts/:id/tenant-sign | 乙方签署 |
| POST | /api/contracts/:id/share | 生成分享链接 |
| GET | /api/contracts/invite-verify/:code | 验证邀请码 |

### 6.3 合同文档

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/contracts/:id/pdf | 生成合同PDF |
| GET | /api/contracts/:id/download | 下载合同PDF |

---

## 七、与原有设计对比

| 原有设计 | 优化后 | 理由 |
|----------|--------|------|
| users.role 字段 | 删除 | 用户角色不固定，通过合同判断 |
| contract_items 表 | 删除 | 条款固定在模板中 |
| contract_inventory 表 | 删除 | 物品清单字段直接存contracts |
| contract_payments 表 | 删除 | 支付计划简化到主表 |
| signatures 表 | 删除 | 签名数据直接存contracts |
| sign_invitations 表 | 删除 | 邀请码直接存contracts |
| 7张表 | 2张表 | 简化查询，提升性能 |

---

*文档更新时间: 2026-03-22*
