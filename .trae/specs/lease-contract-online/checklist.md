# Checklist - 房屋租赁合同数据库优化

## Phase 1: 需求分析与确认

- [x] 用户确认了甲方乙方两种角色
- [x] 用户确认签署流程：甲方创建 → 甲方签署 → 分享给乙方 → 乙方签署
- [x] 用户确认不需要支付管理功能
- [x] 用户确认不需要房源管理功能
- [x] 用户确认不需要合同变更和续租功能
- [x] 用户确认需要存储物品清单（26项）
- [x] 用户确认需要存储签约日期
- [x] 用户确认丙方信息保留但非必填

## Phase 2: 数据库表结构设计

### users 表设计检查
- [x] id 字段（自增主键）
- [x] openid 字段（微信openid，可为空）
- [x] phone 字段（手机号，唯一）
- [x] name 字段（姓名）
- [x] idcard 字段（身份证号）
- [x] idcard_front/idcard_back 字段（身份证照片）
- [x] real_name_status 字段（实名认证状态）
- [x] real_name_at 字段（实名认证时间）
- [x] created_at/updated_at 字段（时间戳）
- [x] 索引：phone, openid
- [x] 删除了 role 字段

### contracts 表设计检查

#### 甲方信息
- [x] lessor_user_id（甲方用户ID，外键）
- [x] lessor_name（甲方姓名）
- [x] lessor_phone（甲方电话）
- [x] lessor_idcard（甲方身份证）
- [x] lessor_account（甲方收款账户）
- [x] lessor_contact（甲方委托代理人）
- [x] partyA_company（甲方公司名称）
- [x] lessor_phone2（甲方第二个电话）

#### 乙方信息
- [x] lessee_name（乙方姓名）
- [x] lessee_phone（乙方电话）
- [x] lessee_idcard（乙方身份证）
- [x] lessee_contact（乙方委托代理人）

#### 房屋信息
- [x] house_address（房屋地址）
- [x] house_area（房屋面积）
- [x] rent_purpose（租赁用途）

#### 租赁期限
- [x] lease_start（租赁开始日期）
- [x] lease_end（租赁结束日期）
- [x] lease_months（租赁月数）

#### 租金信息
- [x] monthly_rent（月租金）
- [x] year_rent（年租金）
- [x] payment_method（支付方式）
- [x] payment_cycle（支付周期）
- [x] payment_count（支付次数）
- [x] advance_notice_days（提前通知天数）
- [x] first_payment_amount（第一次支付金额）
- [x] second_payment_amount/date（第二次支付）
- [x] third_payment_amount/date（第三次支付）

#### 押金
- [x] deposit（押金金额）
- [x] deposit_chinese（押金中文大写）

#### 费用约定
- [x] fee_water（水费乙方承担）
- [x] fee_electric（电费乙方承担）
- [x] fee_gas（燃气费乙方承担）
- [x] fee_tv（电视费乙方承担）
- [x] fee_network（网络费乙方承担）
- [x] fee_property（物业费）
- [x] fee_heating（暖气费）

#### 居间服务
- [x] partyA_commission（甲方佣金）
- [x] partyA_commission_chinese（甲方佣金中文）
- [x] partyB_commission（乙方佣金）
- [x] partyB_commission_chinese（乙方佣金中文）

#### 水电表读数
- [x] electricity_meter（电表读数）
- [x] water_meter（水表读数）
- [x] gas_meter（燃气表读数）

#### 物品清单（26项）
- [x] item_tv_qty ~ item_power_card_qty（所有26项物品数量字段）

#### 备注
- [x] remark（合同备注）

#### 签署状态
- [x] lessor_sign_status（甲方签署状态：0未签/1已签）
- [x] lessee_sign_status（乙方签署状态：0未签/1已签）
- [x] lessor_signed_at（甲方签署时间）
- [x] lessee_signed_at（乙方签署时间）
- [x] lessor_signature（甲方签名图片Base64）
- [x] lessee_signature（乙方签名图片Base64）
- [x] sign_date（签约日期）

#### 合同状态
- [x] status（合同状态：1待甲方签/2待乙方签/3已签署/4已拒绝/5已取消/6已到期）
- [x] reject_reason（拒绝原因）
- [x] effective_at（生效时间）
- [x] expires_at（到期时间）

#### 签署邀请
- [x] invite_code（邀请码）
- [x] invite_expires_at（邀请过期时间）

#### 合同文档
- [x] contract_pdf_path（正式合同PDF路径）

#### 元数据
- [x] contract_no（合同编号）
- [x] title（合同标题）
- [x] created_by（创建人ID）
- [x] created_at/updated_at（时间戳）

#### 索引
- [x] idx_contracts_contract_no
- [x] idx_contracts_created_by
- [x] idx_contracts_lessee_phone
- [x] idx_contracts_invite_code
- [x] idx_contracts_lessor_user_id
- [x] idx_contracts_status

## Phase 3: 数据库实现

- [x] SQLite 初始化脚本创建完成
- [x] MySQL 初始化脚本创建完成
- [x] users 表创建成功
- [x] contracts 表创建成功
- [x] 索引创建成功

## Phase 4: 后端模型层

- [x] User 模型定义正确
- [x] User 模型 CRUD 操作正常
- [x] Contract 模型定义正确
- [x] Contract 模型 CRUD 操作正常
- [x] 签署状态更新方法正常
- [x] 邀请码生成和验证方法正常

## Phase 5: API 接口

- [x] 用户注册/登录接口正常
- [x] 实名认证接口正常
- [x] 创建合同接口正常
- [x] 获取合同详情接口正常
- [x] 合同列表接口正常
- [x] 更新签署状态接口正常
- [x] 生成邀请链接接口正常
- [x] 验证邀请码接口正常
- [x] 甲方签署接口正常
- [x] 乙方签署接口正常

## Phase 6: 前端适配

- [x] 创建合同页面字段更新完成
- [x] 物品清单输入更新完成
- [x] 丙方信息（非必填）更新完成
- [x] 甲方签署流程适配完成
- [x] 乙方签署流程适配完成
- [x] 分享功能适配完成

## Phase 7: 业务流程测试

- [x] 测试甲方创建合同 - 成功
- [x] 测试甲方签署合同 - 成功
- [x] 测试生成邀请链接 - 成功
- [x] 测试乙方接收邀请 - 成功
- [x] 测试乙方签署合同 - 成功
- [x] 测试合同 PDF 生成 - 成功
- [x] 测试双方下载合同 - 成功
