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
  PARTY_A: 'PARTY_A',      // 甲方（出租方）
  PARTY_B: 'PARTY_B'       // 乙方（承租方）
}

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
  getStatusText,
  getStatusColor,
  getPaymentMethodText
}
