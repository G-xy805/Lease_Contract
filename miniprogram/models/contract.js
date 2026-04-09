/**
 * 合同信息接口定义（v2格式核心）
 * 完全匹配 database_schema.md v2.0 规范
 * 对应数据库 contracts 表
 * @module models/contract
 */

/**
 * 费用项接口（IFeeItem）
 * 用于 fee_items JSON 字段
 */
const IFeeItem = {
  name: '',                    // 费用名称 (String): '水费' | '电费' | '燃气费' | ...
  checked: false               // 是否选中 (Boolean): true-由乙方承担, false-不由乙方承担
};

/**
 * 物品清单接口（IInventoryItem）
 * 用于 inventory_items JSON 字段
 */
const IInventoryItem = {
  name: '',                    // 物品名称 (String): '电视' | '衣柜' | '空调' | ...
  quantity: 0,                 // 数量 (Number): 1, 2, 3, ...
  unit: ''                     // 单位 (String, 可选): '台' | '个' | '张' | ...
};

/**
 * 合同信息接口（IContract）⭐ 核心数据模型
 *
 * 重要说明:
 * - 日期字段使用拆分格式: year/month/day (Number|null)，适配微信小程序日期选择器
 * - 费用约定使用 JSON 数组: fee_items (替代原来7个独立布尔字段)
 * - 物品清单使用 JSON 数组: inventory_items (替代原来24个独立数量字段)
 * - 用户关联通过外键: lessor_user_id, lessee_user_id, created_by
 * - 签名和邀请信息通过关联数组: signatures[], invitations[]
 */
const IContract = {
  // ========== 分组1: 基础标识（4个字段）==========
  id: null,                    // 主键ID (INTEGER, 自增)
  contract_no: null,           // 合同编号 (VARCHAR(64), 唯一, 格式: LC+年月日+6位随机数)
  title: null,                 // 合同标题 (VARCHAR(200), 默认: '房屋租赁合同')
  status: null,                // 合同状态 (INTEGER, 1-7):
                               //   1-待甲方签署 | 2-待乙方签署 | 3-已签署 |
                               //   4-已拒绝 | 5-已取消 | 6-已到期

  // ========== 分组2: 用户关联（3个字段）⭐ 新增优化 ==========
  lessor_user_id: null,        // 甲方用户ID (INTEGER, FK→users.id) ⭐v2新增
  lessee_user_id: null,        // 乙方用户ID (INTEGER, FK→users.id, 可为NULL) ⭐v2新增
  created_by: null,            // 创建人用户ID (INTEGER, FK→users.id)

  // ========== 分组3: 甲乙双方信息（11个字段）==========
  partyA_company: null,        // 甲方公司名称或个人姓名 (VARCHAR(200))
  partyA_phone: null,          // 甲方联系电话 (VARCHAR(20))
  partyA_contact: null,        // 甲方委托代理人 (VARCHAR(100))
  partyA_phone2: null,         // 甲方代理人联系电话 (VARCHAR(20))
  partyA_account: null,        // 甲方账户信息 (VARCHAR(100)) - 第三条第3款收款账户
  partyA_idcard: null,         // 甲方身份证号 (VARCHAR(18)) - 不显示在模板中
  partyB_name: null,           // 乙方姓名 (VARCHAR(100))
  partyB_idCard: null,         // 乙方身份证号 (VARCHAR(18))
  partyB_phone: null,          // 乙方联系电话 (VARCHAR(20))
  partyB_contact: null,        // 乙方委托代理人 (VARCHAR(100))

  // ========== 分组4: 房屋基本情况（2个字段）==========
  house_address: null,         // 房屋详细地址 (VARCHAR(255), 必填)
  house_area: null,            // 建筑面积 (DECIMAL(10,2), 单位: 平方米)

  // ========== 分组5: 租赁期限及用途（9个字段）⭐ 日期拆分优化 ==========
  lease_start_year: null,      // 租赁开始年份 (INTEGER, 如: 2026) ⭐日期拆分
  lease_start_month: null,     // 租赁开始月份 (INTEGER, 1-12) ⭐日期拆分
  lease_start_day: null,       // 租赁开始日期 (INTEGER, 1-31) ⭐日期拆分
  lease_end_year: null,        // 租赁结束年份 (INTEGER) ⭐日期拆分
  lease_end_month: null,       // 租赁结束月份 (INTEGER, 1-12) ⭐日期拆分
  lease_end_day: null,         // 租赁结束日期 (INTEGER, 1-31) ⭐日期拆分
  lease_months: null,          // 租赁总月数 (INTEGER)
  rent_purpose: null,          // 租赁用途 (VARCHAR(50)): '居住' | '办公' | ...
  advance_notice_days: null,   // 提前通知续租天数 (INTEGER)

  // ========== 分组6: 租金和支付方式（11个字段）==========
  monthly_rent: null,          // 月租金 (DECIMAL(10,2), 元, 必填)
  year_rent: null,             // 年租金/总租金 (DECIMAL(10,2), 元)
  payment_method: null,        // 支付方式 (INTEGER, 1-4):
                               //   1-按月支付 | 2-按季支付 | 3-半年支付 | 4-年付
  payment_cycle: null,         // 支付周期 (INTEGER, 月数)
  payment_count: null,         // 支付次数 (INTEGER, 默认: 1)
  first_payment_amount: null,  // 第一次支付金额 (DECIMAL(10,2))
  second_payment_amount: null, // 第二次支付金额 (DECIMAL(10,2))
  third_payment_amount: null,  // 第三次支付金额 (DECIMAL(10,2))
  fourth_payment_amount: null, // 第四次支付金额 (DECIMAL(10,2))
  partyA_account_for_rent: null, // 第三条第3款指定收款账户 (VARCHAR(100)) ⭐v2新增

  // ========== 分组7: 押金信息（2个字段）==========
  deposit: null,               // 押金金额 (DECIMAL(10,2), 元, 必填, 默认: 0)
  deposit_chinese: null,       // 押金大写金额 (VARCHAR(100), 如: "贰仟元整")

  // ========== 分组8: 费用约定（1个JSON字段）⭐ JSON优化 ==========
  /**
   * 费用项目 JSON 数组 (TEXT/JSON)
   * 结构示例:
   * [
   *   { "name": "水费", "checked": true },
   *   { "name": "电费", "checked": true },
   *   { "name": "燃气费", "checked": false },
   *   { "name": "有线电视", "checked": false },
   *   { "name": "网络费", "checked": true },
   *   { "name": "物业费", "checked": false },
   *   { "name": "取暖费", "checked": false }
   * ]
   */
  fee_items: null,             // 费用项目 (JSON Array<IFeeItem>) ⭐v2优化: 替代7个布尔字段

  // ========== 分组9: 居间服务（5个字段）==========
  intermediary_name: null,     // 中介方名称 (VARCHAR(100))
  partyA_commission: null,     // 甲方佣金 (DECIMAL(10,2), 元)
  partyA_commission_chinese: null, // 甲方佣金大写 (VARCHAR(100))
  partyB_commission: null,     // 乙方佣金 (DECIMAL(10,2), 元)
  partyB_commission_chinese: null, // 乙方佣金大写 (VARCHAR(100))

  // ========== 分组10: 物品清单及水电表（4个字段）⭐ JSON优化 ==========
  /**
   * 物品清单 JSON 数组 (TEXT/JSON)
   * 结构示例:
   * [
   *   { "name": "电视", "quantity": 1, "unit": "台" },
   *   { "name": "衣柜", "quantity": 2, "unit": "个" },
   *   { "name": "空调", "quantity": 1, "unit": "台" }
   * ]
   */
  inventory_items: null,       // 物品清单 (JSON Array<IInventoryItem>) ⭐v2优化: 替代24个数量字段
  electricity_meter: null,     // 电表读数 (VARCHAR(50))
  water_meter: null,           // 水表读数 (VARCHAR(50))
  gas_meter: null,             // 燃气表读数 (VARCHAR(50))

  // ========== 分组11: 备注及其他约定（1个字段）==========
  remark: null,                // 备注及约定事项 (TEXT)

  // ========== 分组12: 合同文档（1个字段）==========
  contract_pdf_path: null,     // 生成的PDF文件路径 (VARCHAR(255))

  // ========== 分组13: 状态和时间戳（7个字段）==========
  effective_at: null,          // 合同生效时间 (DATETIME) - 双方签署后设置
  expires_at: null,            // 合同过期时间 (DATETIME) - 租赁结束日
  reject_reason: null,         // 拒绝原因 (VARCHAR(255)) - status=4时填写
  sign_date: null,             // 签约日期 (DATE)
  created_at: null,            // 创建时间 (DATETIME)
  updated_at: null,            // 最后更新时间 (DATETIME)

  // ========== 关联数据（非数据库字段，查询时动态填充）==========
  signatures: [],              // 签名记录数组 (Array<ISignature>)
  invitations: []              // 邀请记录数组 (Array<IInvitation>)
};

/**
 * IContract 字段分组说明（用于文档和调试）
 */
const ContractFieldGroups = {
  group1_basic: ['id', 'contract_no', 'title', 'status'],
  group2_user_relation: ['lessor_user_id', 'lessee_user_id', 'created_by'],
  group3_parties: [
    'partyA_company', 'partyA_phone', 'partyA_contact', 'partyA_phone2',
    'partyA_account', 'partyA_idcard',
    'partyB_name', 'partyB_idCard', 'partyB_phone', 'partyB_contact'
  ],
  group4_house: ['house_address', 'house_area'],
  group5_lease_term: [
    'lease_start_year', 'lease_start_month', 'lease_start_day',
    'lease_end_year', 'lease_end_month', 'lease_end_day',
    'lease_months', 'rent_purpose', 'advance_notice_days'
  ],
  group6_payment: [
    'monthly_rent', 'year_rent', 'payment_method', 'payment_cycle',
    'payment_count', 'first_payment_amount', 'second_payment_amount',
    'third_payment_amount', 'fourth_payment_amount', 'partyA_account_for_rent'
  ],
  group7_deposit: ['deposit', 'deposit_chinese'],
  group8_fees: ['fee_items'],
  group9_intermediary: [
    'intermediary_name', 'partyA_commission', 'partyA_commission_chinese',
    'partyB_commission', 'partyB_commission_chinese'
  ],
  group10_inventory: ['inventory_items', 'electricity_meter', 'water_meter', 'gas_meter'],
  group11_remark: ['remark'],
  group12_document: ['contract_pdf_path'],
  group13_timestamp: [
    'effective_at', 'expires_at', 'reject_reason', 'sign_date',
    'created_at', 'updated_at'
  ]
};

/**
 * 导出默认对象作为类型参考
 * 使用方式:
 * const { IContract, IFeeItem, IInventoryItem } = require('./models/contract');
 */
module.exports = {
  IContract,
  IFeeItem,
  IInventoryItem,
  ContractFieldGroups
};
