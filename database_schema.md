# 租约合同数据库设计文档

## 一、数据库概述

- **数据库类型**: SQLite（本地开发测试）
- **数据库文件**: `backend/data/lease_contract.db`
- **存储模式**: WAL (Write-Ahead Logging)

---

## 二、表结构汇总

### 1. users（用户表）

存储用户基本信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 用户ID |
| openid | VARCHAR(64) | DEFAULT NULL | 微信openid |
| phone | VARCHAR(20) | NOT NULL, UNIQUE | 手机号 |
| name | VARCHAR(50) | DEFAULT NULL | 姓名 |
| idcard | VARCHAR(18) | DEFAULT NULL | 身份证号 |
| idcard_front | VARCHAR(255) | DEFAULT NULL | 身份证正面照片路径 |
| idcard_back | VARCHAR(255) | DEFAULT NULL | 身份证背面照片路径 |
| real_name_status | INTEGER | DEFAULT 0 | 实名认证状态（0:未认证, 1:已认证） |
| real_name_at | DATETIME | DEFAULT NULL | 实名认证时间 |
| role | VARCHAR(20) | DEFAULT 'party_b' | 角色（party_a:甲方/房东, party_b:乙方/租客） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- `idx_users_phone` ON `users(phone)`
- `idx_users_openid` ON `users(openid)`

---

### 2. contracts（合同表）

存储租赁合同的核心数据。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 合同ID |
| contract_no | VARCHAR(64) | NOT NULL, UNIQUE | 合同编号（格式: LC+日期+随机码） |
| title | VARCHAR(200) | NOT NULL | 合同标题 |
| **甲方信息** | | | |
| lessor_name | VARCHAR(100) | NOT NULL | 甲方（出租方）姓名 |
| lessor_phone | VARCHAR(20) | NOT NULL | 甲方联系电话 |
| lessor_idcard | VARCHAR(18) | DEFAULT NULL | 甲方身份证号 |
| lessor_account | VARCHAR(100) | DEFAULT NULL | 甲方账户/银行卡号 |
| **乙方信息** | | | |
| lessee_name | VARCHAR(100) | NOT NULL | 乙方（承租方）姓名 |
| lessee_phone | VARCHAR(20) | NOT NULL | 乙方联系电话 |
| lessee_idcard | VARCHAR(18) | DEFAULT NULL | 乙方身份证号 |
| **房屋信息** | | | |
| house_address | VARCHAR(255) | NOT NULL | 房屋地址 |
| house_area | DECIMAL(10,2) | DEFAULT NULL | 房屋面积（平方米） |
| rent_purpose | VARCHAR(50) | DEFAULT NULL | 租赁用途 |
| **租赁期限** | | | |
| lease_start | DATE | NOT NULL | 租赁开始日期 |
| lease_end | DATE | NOT NULL | 租赁结束日期 |
| lease_months | INTEGER | DEFAULT NULL | 租赁月数 |
| advance_notice_days | INTEGER | DEFAULT NULL | 提前通知天数 |
| **租金和支付** | | | |
| monthly_rent | DECIMAL(10,2) | NOT NULL | 月租金 |
| payment_method | INTEGER | DEFAULT 1 | 支付方式（1:月付, 3:季付, 6:半年付, 12:年付） |
| payment_cycle | VARCHAR(20) | DEFAULT NULL | 支付周期说明 |
| payment_count | INTEGER | DEFAULT 1 | 支付次数 |
| first_payment_amount | DECIMAL(10,2) | DEFAULT NULL | 第一次支付金额 |
| first_payment_date | DATE | DEFAULT NULL | 第一次支付日期 |
| second_payment_amount | DECIMAL(10,2) | DEFAULT NULL | 第二次支付金额 |
| second_payment_date | DATE | DEFAULT NULL | 第二次支付日期 |
| third_payment_amount | DECIMAL(10,2) | DEFAULT NULL | 第三次支付金额 |
| third_payment_date | DATE | DEFAULT NULL | 第三次支付日期 |
| total_amount | DECIMAL(12,2) | DEFAULT 0 | 合同总金额 |
| **押金** | | | |
| deposit | DECIMAL(10,2) | DEFAULT 0 | 押金金额 |
| deposit_chinese | VARCHAR(100) | DEFAULT NULL | 押金金额中文大写 |
| **费用约定（乙方承担）** | | | |
| fee_water | BOOLEAN | DEFAULT TRUE | 水费乙方承担 |
| fee_electric | BOOLEAN | DEFAULT TRUE | 电费乙方承担 |
| fee_gas | BOOLEAN | DEFAULT TRUE | 燃气费乙方承担 |
| fee_tv | BOOLEAN | DEFAULT TRUE | 电视费乙方承担 |
| fee_network | BOOLEAN | DEFAULT TRUE | 网络费乙方承担 |
| fee_property | BOOLEAN | DEFAULT FALSE | 物业费乙方承担 |
| fee_heating | BOOLEAN | DEFAULT FALSE | 暖气费乙方承担 |
| **居间服务** | | | |
| intermediary_name | VARCHAR(100) | DEFAULT NULL | 居间人/中介名称 |
| partyA_commission | DECIMAL(10,2) | DEFAULT NULL | 甲方佣金 |
| partyB_commission | DECIMAL(10,2) | DEFAULT NULL | 乙方佣金 |
| **水电表读数** | | | |
| electricity_meter | DECIMAL(10,2) | DEFAULT NULL | 电表读数 |
| water_meter | DECIMAL(10,2) | DEFAULT NULL | 水表读数 |
| gas_meter | DECIMAL(10,2) | DEFAULT NULL | 燃气表读数 |
| **备注** | | | |
| remark | TEXT | DEFAULT NULL | 合同备注 |
| **状态** | | | |
| status | INTEGER | DEFAULT 1 | 合同状态（1:草稿, 2:待签署, 3:已签署, 4:已拒绝, 5:已取消, 6:已到期） |
| effective_at | DATETIME | DEFAULT NULL | 合同生效时间 |
| expires_at | DATETIME | DEFAULT NULL | 合同到期时间 |
| reject_reason | VARCHAR(255) | DEFAULT NULL | 拒绝原因 |
| created_by | INTEGER | | 创建人用户ID（外键关联users.id） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- `idx_contracts_contract_no` ON `contracts(contract_no)`
- `idx_contracts_created_by` ON `contracts(created_by)`
- `idx_contracts_lessee_phone` ON `contracts(lessee_phone)`

---

### 3. contract_items（合同条款表）

存储合同的具体条款内容。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 条款ID |
| contract_id | INTEGER | NOT NULL, FOREIGN KEY | 关联合同ID |
| item_title | VARCHAR(200) | NOT NULL | 条款标题 |
| item_content | TEXT | NOT NULL | 条款内容 |
| item_order | INTEGER | DEFAULT 0 | 条款顺序 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**外键**: `contract_id` REFERENCES `contracts(id)`

---

### 4. contract_inventory（合同物品清单表）

存储房屋内的物品清单。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 物品ID |
| contract_id | INTEGER | NOT NULL, FOREIGN KEY | 关联合同ID |
| item_name | VARCHAR(100) | NOT NULL | 物品名称 |
| item_quantity | VARCHAR(20) | DEFAULT NULL | 物品数量 |
| item_unit | VARCHAR(10) | DEFAULT NULL | 物品单位 |
| item_confirmed | BOOLEAN | DEFAULT FALSE | 是否已确认 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**外键**: `contract_id` REFERENCES `contracts(id)`

---

### 5. contract_payments（付款记录表）

存储合同的分期付款记录。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 记录ID |
| contract_id | INTEGER | NOT NULL, FOREIGN KEY | 关联合同ID |
| period | VARCHAR(50) | NOT NULL | 期数（如"第1期"、"第2期"） |
| amount | DECIMAL(10,2) | NOT NULL | 应付金额 |
| due_date | DATE | NOT NULL | 应付款日期 |
| paid_date | DATE | DEFAULT NULL | 实际付款日期 |
| status | INTEGER | DEFAULT 0 | 支付状态（0:未付, 1:已付） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**外键**: `contract_id` REFERENCES `contracts(id)`

---

### 6. signatures（电子签名表）

存储合同的电子签名信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 签名ID |
| contract_id | INTEGER | NOT NULL, FOREIGN KEY | 关联合同ID |
| sign_type | VARCHAR(20) | NOT NULL | 签名类型（lessor:甲方, lessee:乙方） |
| sign_name | VARCHAR(100) | NOT NULL | 签名人姓名 |
| sign_phone | VARCHAR(20) | NOT NULL | 签名人手机号 |
| sign_idcard | VARCHAR(18) | DEFAULT NULL | 签名人身份证号 |
| signature_data | TEXT | NOT NULL | 签名图片数据（Base64） |
| signed_at | DATETIME | DEFAULT NULL | 签名时间 |
| ip_address | VARCHAR(50) | DEFAULT NULL | 签名时IP地址 |
| device_info | VARCHAR(255) | DEFAULT NULL | 签名时设备信息 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**外键**: `contract_id` REFERENCES `contracts(id)`
**索引**: `idx_signatures_contract_id` ON `signatures(contract_id)`

---

### 7. sign_invitations（签署邀请表）

存储合同签署邀请信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 邀请ID |
| contract_id | INTEGER | NOT NULL, FOREIGN KEY | 关联合同ID |
| lessee_name | VARCHAR(100) | NOT NULL | 被邀请人（乙方）姓名 |
| lessee_phone | VARCHAR(20) | NOT NULL | 被邀请人（乙方）手机号 |
| lessee_idcard | VARCHAR(18) | DEFAULT NULL | 被邀请人（乙方）身份证号 |
| invite_code | VARCHAR(64) | NOT NULL, UNIQUE | 邀请码 |
| status | INTEGER | DEFAULT 0 | 邀请状态（0:待签署, 1:已签署, 2:已拒绝, 3:已过期） |
| expires_at | DATETIME | NOT NULL | 邀请过期时间 |
| signed_at | DATETIME | DEFAULT NULL | 签署时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**外键**: `contract_id` REFERENCES `contracts(id)`
**索引**: `idx_invitations_invite_code` ON `sign_invitations(invite_code)`

---

## 三、表关系图

```
users (用户表)
    │
    │ created_by
    ▼
contracts (合同表) ◄──────────────────────┐
    │                                    │
    ├─── contract_items (合同条款)        │
    ├─── contract_inventory (物品清单)     │
    ├─── contract_payments (付款记录)      │
    ├─── signatures (签名)                │
    │                                    │
    └─── sign_invitations (签署邀请) ─────┘
```

---

## 四、合同状态说明

| 状态值 | 常量名 | 说明 |
|--------|--------|------|
| 1 | DRAFT | 草稿 |
| 2 | PENDING_LANDLORD_SIGN | 待甲方签署 |
| 3 | PENDING_TENANT_SIGN | 待乙方签署 |
| 4 | SIGNED | 已签署（生效） |
| 5 | REJECTED | 已拒绝 |
| 6 | CANCELLED | 已取消 |
| 7 | EXPIRED | 已到期 |

---

## 五、支付方式说明

| 方式值 | 说明 |
|--------|------|
| 1 | 月付 |
| 3 | 季付（3个月） |
| 6 | 半年付（6个月） |
| 12 | 年付（12个月） |

---

## 六、用户角色说明

| 角色值 | 说明 |
|--------|------|
| party_a | 甲方/房东 |
| party_b | 乙方/租客 |

---

## 七、实名认证状态

| 状态值 | 说明 |
|--------|------|
| 0 | 未认证 |
| 1 | 已认证 |
| 2 | 认证中 |
| 3 | 认证失败 |

---

*文档生成时间: 2026-03-22*
