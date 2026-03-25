# 前端微信小程序优化重构方案

## 一、需求背景

### 现有问题

1. **字段不匹配**：前端部分字段与后端数据库字段不一致，如 `intermediary_name`（前端有，后端无）
2. **物品清单处理不当**：前端使用 `fixedItems` 数组存储物品，但后端需要 `item_xxx_qty` 格式的字段
3. **状态值错误**：前端创建合同时设置 `status: 2`，但后端期望 `status: 1`（待甲方签署）
4. **签署API路径错误**：前端调用 `/lessor-sign`，但后端实际路径是 `/sign`
5. **页面冗余**：存在多个功能重叠的页面（如 `invitations`、`invite-preview`、`invite-verify`）

### 核心需求

1. **字段对齐**：前端字段必须与后端数据库字段完全一致
2. **流程简化**：按照后端业务流程重构前端页面
3. **物品清单映射**：将前端物品数组转换为后端需要的 `item_xxx_qty` 字段格式

---

## 二、设计原则

1. **字段一致性**：前端字段名称和类型必须与后端数据库字段完全一致
2. **流程对齐**：前端页面流程必须与后端API流程完全对齐
3. **简化优先**：删除冗余页面和功能
4. **数据映射**：物品清单需要正确映射到数据库字段

---

## 三、数据库字段与前端字段映射

### 3.1 合同主表字段（contracts）

| 后端字段 | 前端字段 | 类型 | 必填 | 说明 |
|---------|---------|------|------|------|
| contract_no | - | string | 自动 | 合同编号（后端生成） |
| title | title | string | 是 | 合同标题 |
| lessor_user_id | - | int | 自动 | 甲方用户ID（后端从token获取） |
| lessor_name | lessor_name | string | 是 | 甲方姓名 |
| lessor_phone | lessor_phone | string | 是 | 甲方电话 |
| lessor_phone2 | lessor_phone2 | string | 否 | 甲方电话2 |
| lessor_idcard | lessor_idcard | string | 否 | 甲方身份证 |
| lessor_account | lessor_account | string | 否 | 甲方收款账户 |
| lessor_contact | lessor_contact | string | 否 | 甲方委托代理人 |
| partyA_company | partyA_company | string | 否 | 甲方公司名称 |
| lessee_name | lessee_name | string | 是 | 乙方姓名 |
| lessee_phone | lessee_phone | string | 是 | 乙方电话 |
| lessee_idcard | lessee_idcard | string | 是 | 乙方身份证 |
| lessee_contact | lessee_contact | string | 否 | 乙方委托代理人 |
| house_address | house_address | string | 是 | 房屋地址 |
| house_area | house_area | decimal | 否 | 房屋面积 |
| rent_purpose | rent_purpose | string | 否 | 租赁用途 |
| lease_start | lease_start | date | 是 | 租赁开始日期 |
| lease_end | lease_end | date | 是 | 租赁结束日期 |
| lease_months | lease_months | int | 否 | 租赁月数 |
| monthly_rent | monthly_rent | decimal | 是 | 月租金 |
| year_rent | year_rent | decimal | 否 | 年租金 |
| payment_method | payment_method | int | 否 | 支付方式（1:月付,3:季付,6:半年付,12:年付） |
| payment_cycle | payment_cycle | string | 否 | 支付周期文本 |
| payment_count | payment_count | int | 否 | 支付次数 |
| advance_notice_days | advance_notice_days | int | 否 | 提前通知天数 |
| first_payment_amount | first_payment_amount | decimal | 否 | 第一次支付金额 |
| first_payment_date | first_payment_date | date | 否 | 第一次支付日期 |
| second_payment_amount | second_payment_amount | decimal | 否 | 第二次支付金额 |
| second_payment_date | second_payment_date | date | 否 | 第二次支付日期 |
| third_payment_amount | third_payment_amount | decimal | 否 | 第三次支付金额 |
| third_payment_date | third_payment_date | date | 否 | 第三次支付日期 |
| deposit | deposit | decimal | 是 | 押金金额 |
| deposit_chinese | deposit_chinese | string | 否 | 押金中文大写 |
| fee_water | fee_water | boolean | - | 水费乙方承担 |
| fee_electric | fee_electric | boolean | - | 电费乙方承担 |
| fee_gas | fee_gas | boolean | - | 燃气费乙方承担 |
| fee_tv | fee_tv | boolean | - | 电视费乙方承担 |
| fee_network | fee_network | boolean | - | 网络费乙方承担 |
| fee_property | fee_property | boolean | - | 物业费甲方承担 |
| fee_heating | fee_heating | boolean | - | 暖气费甲方承担 |
| partyA_commission | partyA_commission | decimal | 否 | 甲方佣金 |
| partyA_commission_chinese | partyA_commission_chinese | string | 否 | 甲方佣金中文 |
| partyB_commission | partyB_commission | decimal | 否 | 乙方佣金 |
| partyB_commission_chinese | partyB_commission_chinese | string | 否 | 乙方佣金中文 |
| electricity_meter | electricity_meter | decimal | 否 | 电表读数 |
| water_meter | water_meter | decimal | 否 | 水表读数 |
| gas_meter | gas_meter | decimal | 否 | 燃气表读数 |
| remark | remark | text | 否 | 备注 |

### 3.2 物品清单字段映射

前端 `fixedItems` 数组需要转换为后端字段：

| 前端物品名称 | 后端字段 |
|-------------|---------|
| 电视 | item_tv_qty |
| 衣柜 | item_wardrobe_qty |
| 电视（遥控器） | item_tv_remote_qty |
| 电视柜 | item_tv_table_qty |
| 机顶盒（遥控器） | item_box_qty |
| 沙发 | item_sofa_qty |
| 茶几 | item_coffee_table_qty |
| 餐桌 | item_dining_table_qty |
| 餐桌椅 | item_chair_qty |
| 床 | item_bed_qty |
| 床头柜 | item_nightstand_qty |
| 窗帘 | item_curtain_qty |
| 空调 | item_ac_qty |
| 空调（遥控器） | item_ac_remote_qty |
| 冰箱 | item_fridge_qty |
| 床垫子 | item_mattress_qty |
| 洗衣机 | item_washer_qty |
| 热水器 | item_water_heater_qty |
| 煤气灶 | item_gas_stove_qty |
| 油烟机 | item_hood_qty |
| 电磁灶 | item_induction_qty |
| 门禁卡 | item_door_card_qty |
| 水卡 | item_water_card_qty |
| 电卡 | item_power_card_qty |

### 3.3 删除的前端字段

以下字段在后端数据库中不存在，需要从前端删除：

| 字段 | 说明 |
|------|------|
| intermediary_name | 后端无此字段，丙方信息使用 partyA_commission/partyB_commission |
| annual_rent | 计算字段，后端使用 year_rent |
| items | 后端不需要 items 数组，使用 item_xxx_qty 字段 |

---

## 四、页面重构方案

### 4.1 保留页面

| 页面 | 功能 | 状态 |
|------|------|------|
| pages/index/index | 首页 | 保留 |
| pages/login/index | 登录 | 保留 |
| pages/contracts/index | 合同列表 | 保留 |
| pages/create-contract/index | 创建合同 | 优化 |
| pages/sign-contract/index | 签署合同 | 优化 |
| pages/contract-detail/index | 合同详情 | 优化 |
| pages/profile/index | 个人中心 | 保留 |

### 4.2 删除页面

| 页面 | 原因 |
|------|------|
| pages/invitations/index | 功能合并到 contracts |
| pages/invite-preview/index | 功能合并到 sign-contract |
| pages/preview-contract/index | 功能合并到 contract-detail |
| pages/reject-contract/index | 简化流程，直接在详情页拒绝 |
| pages/my-contracts/index | 与 contracts 合并 |
| pages/invite-verify/index | 功能合并到 sign-contract |
| pages/real-name/index | 实名认证功能可保留，但需优化 |

---

## 五、API 接口对齐

### 5.1 创建合同

**请求**：
```json
POST /api/contracts
{
  "title": "房屋租赁合同 - xxx",
  "lessor_name": "张三",
  "lessor_phone": "13800138000",
  "lessor_phone2": null,
  "lessor_contact": null,
  "partyA_company": null,
  "lessor_idcard": null,
  "lessor_account": null,
  "lessee_name": "李四",
  "lessee_phone": "13900139000",
  "lessee_idcard": "110101199001011234",
  "house_address": "北京市朝阳区xxx",
  "house_area": 80.5,
  "rent_purpose": "居住",
  "lease_start": "2026-04-01",
  "lease_end": "2027-03-31",
  "lease_months": 12,
  "monthly_rent": 5000,
  "year_rent": 60000,
  "payment_method": 1,
  "payment_cycle": "月付",
  "payment_count": 1,
  "advance_notice_days": 30,
  "first_payment_amount": 5000,
  "first_payment_date": "2026-04-01",
  "deposit": 10000,
  "deposit_chinese": "壹万元整",
  "fee_water": true,
  "fee_electric": true,
  "fee_gas": true,
  "fee_tv": true,
  "fee_network": true,
  "fee_property": false,
  "fee_heating": false,
  "partyA_commission": null,
  "partyB_commission": null,
  "electricity_meter": null,
  "water_meter": null,
  "gas_meter": null,
  "remark": null,
  "item_tv_qty": 1,
  "item_ac_qty": 2,
  ...
}
```

**响应**：
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "contract": {
      "id": 1,
      "contract_no": "LC20260322abc123",
      "status": 1
    }
  }
}
```

### 5.2 甲方签署

**请求**：
```json
POST /api/contracts/:id/sign
{
  "signature": "data:image/png;base64,..."
}
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "invite_code": "LC20260322abc123",
    "contract": {
      "status": 2
    }
  }
}
```

### 5.3 乙方签署

**请求**：
```json
POST /api/contracts/:id/tenant-sign
{
  "signature": "data:image/png;base64,..."
}
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "contract": {
      "status": 3
    }
  }
}
```

---

## 六、状态枚举对齐

| 值 | 后端常量 | 前端显示 |
|----|---------|---------|
| 1 | PENDING_LESSOR_SIGN | 待甲方签署 |
| 2 | PENDING_LESSEE_SIGN | 待乙方签署 |
| 3 | SIGNED | 已签署 |
| 4 | REJECTED | 已拒绝 |
| 5 | CANCELLED | 已取消 |
| 6 | EXPIRED | 已到期 |

---

*文档生成时间: 2026-03-22*
