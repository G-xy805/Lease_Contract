/**
 * 常量定义文件
 * 包含系统中使用的所有枚举和常量定义
 * @module utils/constants
 */

// ========== 合同状态相关 ==========

/**
 * 合同状态枚举（ContractStatus）
 * 完全匹配 database_schema.md v2.0 定义
 *
 * 状态流转规则:
 *   1: 待甲方签署 ──→ 2: 待乙方签署（甲方签署成功）
 *                   │         ├──→ 3: 已签署 ✓（乙方签署成功）→ 终态
 *                   │         ├──→ 4: 已拒绝 ✗（乙方拒绝）→ 终态
 *                   │         └──→ 5: 已取消 ✗（任一方取消）→ 终态
 *                   └──→ 5: 已取消 ✗（甲方取消）→ 终态
 *
 *   3: 已签署 ──→ 6: 已到期（租赁期满自动触发）→ 终态
 *            └──→ 5: 已取消（提前终止）→ 终态
 *
 * 终态节点（不可再流转）:
 *   ✅ 3: 已签署（生效）
 *   ❌ 4: 已拒绝
 *   ❌ 5: 已取消
 *   ⏰ 6: 已到期
 */
const ContractStatus = {
  PENDING_LESSOR_SIGN: 1,    // 待甲方签署 - 初始状态（合同创建后）
  PENDING_LESSEE_SIGN: 2,    // 待乙方签署 - 甲方已签署，等待乙方
  SIGNED: 3,                  // 已签署（生效）- 双方都已签署
  REJECTED: 4,                // 已拒绝 - 乙方拒绝签署
  CANCELLED: 5,               // 已取消 - 任一方或系统取消
  EXPIRED: 6                   // 已到期 - 租赁期满自动触发
};

/**
 * 合同状态文本映射（中文显示）
 */
const CONTRACT_STATUS_TEXT = {
  [ContractStatus.PENDING_LESSOR_SIGN]: '待甲方签署',
  [ContractStatus.PENDING_LESSEE_SIGN]: '待乙方签署',
  [ContractStatus.SIGNED]: '已签署',
  [ContractStatus.REJECTED]: '已拒绝',
  [ContractStatus.CANCELLED]: '已取消',
  [ContractStatus.EXPIRED]: '已到期'
};

/**
 * 合同状态颜色映射（用于UI标签显示）
 * 颜色规范:
 *   1: #1989fa (蓝色) - 等待中
 *   2: #ff976a (橙色) - 等待中
 *   3: #07c160 (绿色) - 成功/生效
 *   4: #ee0a24 (红色) - 失败/拒绝
 *   5: #969799 (灰色) - 取消/终止
 *   6: #969799 (灰色) - 过期
 */
const CONTRACT_STATUS_COLOR = {
  [ContractStatus.PENDING_LESSOR_SIGN]: '#1989fa',  // 蓝 - 待处理
  [ContractStatus.PENDING_LESSEE_SIGN]: '#ff976a',  // 橙 - 待处理
  [ContractStatus.SIGNED]: '#07c160',               // 绿 - 成功
  [ContractStatus.REJECTED]: '#ee0a24',             // 红 - 拒绝
  [ContractStatus.CANCELLED]: '#969799',            // 灰 - 取消
  [ContractStatus.EXPIRED]: '#969799'               // 灰 - 过期
};

// ========== 用户角色相关 ==========

/**
 * 用户角色枚举（UserRole）
 * 定义系统中的三种用户角色
 */
const UserRole = {
  LESSOR: 'LESSOR',           // 房东/甲方 - 出租方，可创建合同、发起签署
  LESSEE: 'LESSEE',           // 租客/乙方 - 承租方，接收邀请、签署合同
  ADMIN: 'ADMIN'              // 管理员 - 系统管理、查看所有合同
};

// 原有 USER_ROLE 保持向后兼容（建议使用 UserRole）
const USER_ROLE = UserRole;

// ========== 支付方式相关 ==========

/**
 * 支付方式枚举（PaymentMethod）
 * 定义租金支付周期类型
 */
const PaymentMethod = {
  MONTHLY: 1,                 // 按月支付 - 押一付一（月付）
  QUARTERLY: 2,               // 按季支付 - 押一付三（每3个月1次）
  SEMI_ANNUAL: 3,             // 半年支付 - 押一付六（每6个月1次）
  ANNUAL: 4                   // 年付 - 年付（每年1次）
};

/**
 * 支付方式文本映射（中文显示）
 */
const PaymentMethodText = {
  [PaymentMethod.MONTHLY]: '按月支付',
  [PaymentMethod.QUARTERLY]: '按季支付',
  [PaymentMethod.SEMI_ANNUAL]: '半年支付',
  [PaymentMethod.ANUAL]: '年付'
};

// 原有 PAYMENT_METHODS 保持向后兼容（键值对调，建议使用 PaymentMethodText）
const PAYMENT_METHODS = {
  1: '押一付一',
  2: '押一付三',
  3: '押一付六',
  4: '年付'
};

// ========== 实名认证状态相关 ==========

/**
 * 实名认证状态枚举（RealNameStatus）
 */
const RealNameStatus = {
  NOT_AUTH: 0,                // 未认证
  AUTHENTICATING: 1,          // 认证中
  AUTHENTICATED: 2,           // 已认证
  FAILED: 3                   // 认证失败
};

// 原有 REAL_NAME_STATUS 保持向后兼容
const REAL_NAME_STATUS = RealNameStatus;

// ========== 签署角色和状态相关 ⭐v2新增 ==========

/**
 * 签署角色枚举（SignRole）
 * 明确标识签名记录属于哪一方
 */
const SignRole = {
  LESSOR: 'LESSOR',           // 甲方/出租方 - 房东签署
  LESSEE: 'LESSEE'            // 乙方/承租方 - 租客签署
};

/**
 * 签署状态枚举（SignStatus）⭐v2更新
 *
 * 状态流转:
 *   0: 待确认 ──→ 1: 已确认（用户确认签名）
 *       └──→ 2: 已撤销（用户主动撤回）
 */
const SignStatus = {
  PENDING: 0,                 // 待确认 - 刚提交签名，等待最终确认
  CONFIRMED: 1,               // 已确认 - 用户确认，签署完成
  REVOKED: 2                  // 已撤销 - 用户主动撤回
};

/**
 * 签署状态文本映射（中文显示）
 */
const SIGN_STATUS_TEXT = {
  [SignStatus.PENDING]: '待确认',
  [SignStatus.CONFIRMED]: '已确认',
  [SignStatus.REVOKED]: '已撤销'
};

// ========== 邀请状态相关 ⭐v2新增 ==========

/**
 * 邀请状态枚举（InvitationStatus）
 *
 * 状态流转:
 *   0: 待处理 ──→ 1: 已接受（被邀请人同意）
 *       ├──→ 2: 已拒绝（被邀请人拒绝）
 *       └──→ 3: 已过期（超过有效期，默认72小时）
 */
const InvitationStatus = {
  PENDING: 0,                 // 待处理 - 刚创建
  ACCEPTED: 1,                // 已接受 - 被邀请人同意
  REFUSED: 2,                 // 已拒绝 - 被邀请人拒绝
  EXPIRED: 3                  // 已过期 - 超过有效期
};

/**
 * 邀请状态文本映射（中文显示）
 */
const INVITATION_STATUS_TEXT = {
  [InvitationStatus.PENDING]: '待处理',
  [InvitationStatus.ACCEPTED]: '已接受',
  [InvitationStatus.REFUSED]: '已拒绝',
  [InvitationStatus.EXPIRED]: '已过期'
};

// ========== 应用配置常量 ==========

/**
 * 应用全局配置（APP_CONFIG）
 */
const APP_CONFIG = {
  DEFAULT_COMPANY_NAME: '内蒙古恒之寓酒店管理有限公司',  // 默认公司名称
  TOKEN_REFRESH_THRESHOLD: 30 * 60 * 1000,               // Token刷新阈值（30分钟）
  AUTO_SAVE_INTERVAL: 30000,                             // 自动保存间隔（30秒）
  CONTRACT_DRAFT_KEY: 'contract_draft',                  // 合同草稿本地存储key
  DEFAULT_ADVANCE_NOTICE_DAYS: 30                        // 默认提前通知续租天数
};

/**
 * 邀请默认有效期（小时）
 */
const INVITATION_DEFAULT_EXPIRE_HOURS = 72;

/**
 * 导出所有常量
 * 使用方式: const { ContractStatus, UserRole, ... } = require('./utils/constants');
 */
module.exports = {
  // 合同状态
  ContractStatus,
  CONTRACT_STATUS_TEXT,
  CONTRACT_STATUS_COLOR,

  // 用户角色
  UserRole,
  USER_ROLE,  // 向后兼容

  // 支付方式
  PaymentMethod,
  PaymentMethodText,
  PAYMENT_METHODS,  // 向后兼容

  // 实名认证
  RealNameStatus,
  REAL_NAME_STATUS,  // 向后兼容

  // 签署相关 ⭐v2新增
  SignRole,
  SignStatus,
  SIGN_STATUS_TEXT,

  // 邀请相关 ⭐v2新增
  InvitationStatus,
  INVITATION_STATUS_TEXT,

  // 应用配置
  APP_CONFIG,
  INVITATION_DEFAULT_EXPIRE_HOURS
};
