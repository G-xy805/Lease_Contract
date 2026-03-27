/**
 * 常量定义
 * 统一使用数字状态值，与后端 ContractStatus 枚举一致
 */

// 合同状态枚举（与后端 ContractStatus 一致）
const CONTRACT_STATUS = {
  PENDING_LESSOR_SIGN: 1,   // 待甲方签署
  PENDING_LESSEE_SIGN: 2,   // 待乙方签署
  SIGNED: 3,                // 已签署
  REJECTED: 4,              // 已拒绝
  CANCELLED: 5,             // 已取消
  EXPIRED: 6                // 已到期
}

// 合同状态文本映射
const CONTRACT_STATUS_TEXT = {
  1: '待甲方签署',
  2: '待乙方签署',
  3: '已签署',
  4: '已拒绝',
  5: '已取消',
  6: '已到期'
}

// 合同状态颜色映射（vant-ui tag type）
const CONTRACT_STATUS_COLOR = {
  1: 'primary',    // 蓝色 - 待甲方签署
  2: 'warning',    // 橙色 - 待乙方签署
  3: 'success',    // 绿色 - 已签署
  4: 'danger',     // 红色 - 已拒绝
  5: 'default',    // 灰色 - 已取消
  6: 'warning'     // 紫色 - 已到期
}

// 付款方式
const PAYMENT_METHODS = {
  1: '押一付一',
  2: '押一付三',
  3: '押一付六',
  4: '年付'
}

// 用户角色（与后端 UserRole 一致）
const USER_ROLE = {
  LESSOR: 'LESSOR',      // 甲方（出租方）- 房东
  LESSEE: 'LESSEE',       // 乙方（承租方）- 租客
  ADMIN: 'ADMIN'          // 系统管理员
}

// 字段映射：旧字段 -> 新字段（lessor_* -> partyA_*, lessee_* -> partyB_*）
const FIELD_MAPPING_LESSOR = {
  lessor_name: 'partyA_company',
  lessor_phone: 'partyA_phone',
  lessor_phone2: 'partyA_phone2',
  lessor_contact: 'partyA_contact',
  lessor_idcard: 'partyA_idcard',
  lessor_account: 'partyA_account'
}

const FIELD_MAPPING_LESSEE = {
  lessee_name: 'partyB_name',
  lessee_phone: 'partyB_phone',
  lessee_idcard: 'partyB_idCard',
  lessee_contact: 'partyB_contact'
}

// 物品清单字段映射（name -> templateField）
const INVENTORY_ITEMS_MAPPING = {
  '电视': 'item_tv_qty',
  '衣柜': 'item_wardrobe_qty',
  '电视（遥控器）': 'item_tv_remote_qty',
  '电视柜': 'item_tv_table_qty',
  '机顶盒（遥控器）': 'item_box_qty',
  '沙发': 'item_sofa_qty',
  '茶几': 'item_coffee_table_qty',
  '餐桌': 'item_dining_table_qty',
  '餐桌椅': 'item_chair_qty',
  '床': 'item_bed_qty',
  '床头柜': 'item_nightstand_qty',
  '窗帘': 'item_curtain_qty',
  '空调': 'item_ac_qty',
  '空调（遥控器）': 'item_ac_remote_qty',
  '冰箱': 'item_fridge_qty',
  '床垫子': 'item_mattress_qty',
  '洗衣机': 'item_washer_qty',
  '热水器': 'item_water_heater_qty',
  '煤气灶': 'item_gas_stove_qty',
  '油烟机': 'item_hood_qty',
  '电磁灶': 'item_induction_qty',
  '门禁卡': 'item_door_card_qty',
  '水卡': 'item_water_card_qty',
  '电卡': 'item_power_card_qty'
}

// 物品清单反向映射（templateField -> name）
const INVENTORY_ITEMS_REVERSE_MAPPING = Object.fromEntries(
  Object.entries(INVENTORY_ITEMS_MAPPING).map(([name, field]) => [field, name])
)

// 事件名称
const EVENT_NAME = {
  LOGIN_SUCCESS: 'loginSuccess',
  LOGOUT: 'logout',
  CONTRACT_UPDATE: 'contractUpdate'
}

// Storage Keys
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  SEARCH_HISTORY: 'searchHistory'
}

/**
 * 获取状态文本
 * @param {number} status - 状态值(1-6)
 * @returns {string} 状态文本
 */
function getStatusText(status) {
  return CONTRACT_STATUS_TEXT[status] || '未知状态'
}

/**
 * 获取状态颜色
 * @param {number} status - 状态值(1-6)
 * @returns {string} vant-ui tag type
 */
function getStatusColor(status) {
  return CONTRACT_STATUS_COLOR[status] || 'default'
}

/**
 * 获取支付方式文本
 * @param {number} method - 支付方式值(1-4)
 * @returns {string} 支付方式文本
 */
function getPaymentMethodText(method) {
  return PAYMENT_METHODS[method] || '未知方式'
}

module.exports = {
  CONTRACT_STATUS,
  CONTRACT_STATUS_TEXT,
  CONTRACT_STATUS_COLOR,
  PAYMENT_METHODS,
  USER_ROLE,
  EVENT_NAME,
  STORAGE_KEYS,
  FIELD_MAPPING_LESSOR,
  FIELD_MAPPING_LESSEE,
  INVENTORY_ITEMS_MAPPING,
  INVENTORY_ITEMS_REVERSE_MAPPING,
  getStatusText,
  getStatusColor,
  getPaymentMethodText
}
