/**
 * 邀请记录接口定义（v2简化版）
 * 对应数据库 sign_invitations 表
 * @module models/invitation
 *
 * v2 简化说明:
 * - 从原 26 个字段精简为 16 个字段（精简 38%）
 * - 移除冗余的 receiver_* 字段，统一使用 invitee_* 前缀
 * - 新增 view_count 和 last_viewed_at 统计追踪字段
 */

/**
 * 邀请记录接口（IInvitation）
 * 用于存储签署邀请记录，支持邀请对方签署合同
 */
const IInvitation = {
  // 基础标识字段
  id: null,                    // 主键ID (INTEGER, 自增)
  contract_id: null,           // 关联合同ID (INTEGER, FK→contracts.id, 必填)
  invitation_no: null,         // 邀请编号 (VARCHAR(64), 唯一, 格式: INV+时间戳+随机数)
  invite_code: null,           // 邀请码 (VARCHAR(64), 唯一) ⭐用于分享链接（短信/微信）

  // 邀请人信息
  inviter_id: null,            // 邀请人用户ID (INTEGER, FK→users.id, 必填)

  // 被邀请人信息 ⭐v2统一前缀
  invitee_name: null,          // 被邀请人姓名 (VARCHAR(100), 必填) - 原 receiver_name
  invitee_phone: null,         // 被邀请人手机号 (VARCHAR(20), 必填) - 原 receiver_phone
  invitee_role: null,          // 被邀请方角色 (VARCHAR(10), 必填): 'LESSOR' | 'LESSEE'

  // 邀请状态字段
  /**
   * 邀请状态 (INTEGER, 默认: 0, 范围: 0-3)
   * 状态流转:
   *   0: 待处理（刚创建，待发送）
   *     └─→ 1: 已接受（被邀请人点击接受）
   *     └─→ 2: 已拒绝（被邀请人点击拒绝）
   *     └─→ 3: 已过期（超过 expires_at 时间）
   */
  status: null,                // 0-待处理 | 1-已接受 | 2-已拒绝 | 3-已过期

  // 时间相关字段
  expires_at: null,            // 过期时间 (DATETIME, 必填) - 通常72小时后
  accepted_at: null,           // 接受时间 (DATETIME) - status=1时填写

  // 拒绝原因
  refused_reason: null,        // 拒绝原因 (VARCHAR(255)) - status=2时填写

  // 统计追踪字段 ⭐v2新增
  view_count: null,            // 查看次数 (INTEGER, 默认: 0) - 用于统计追踪
  last_viewed_at: null,        // 最后查看时间 (DATETIME) - 用于统计追踪

  // 时间戳字段
  created_at: null,            // 创建时间 (DATETIME)
  updated_at: null             // 更新时间 (DATETIME)
};

/**
 * 邀请状态枚举值说明（InvitationStatus）及流转规则
 */
const InvitationStatusEnum = {
  PENDING: 0,                  // 待处理 - 刚创建，等待发送或被查看
  ACCEPTED: 1,                 // 已接受 - 被邀请人同意签署
  REFUSED: 2,                  // 已拒绝 - 被邀请人拒绝签署
  EXPIRED: 3                   // 已过期 - 超过有效期（默认72小时）
};

/**
 * InvitationStatus 合法流转规则
 */
const InvitationStatusFlow = {
  [InvitationStatusEnum.PENDING]: [
    InvitationStatusEnum.ACCEPTED,
    InvitationStatusEnum.REFUSED,
    InvitationStatusEnum.EXPIRED
  ],
  [InvitationStatusEnum.ACCEPTED]: [],  // 终态，不可再流转
  [InvitationStatusEnum.REFUSED]: [],   // 终态，不可再流转
  [InvitationStatusEnum.EXPIRED]: []    // 终态，不可再流转
};

/**
 * 默认有效期配置（单位: 小时）
 */
const INVITATION_DEFAULT_EXPIRE_HOURS = 72;

/**
 * 导出默认对象作为类型参考
 * 使用方式:
 * const { IInvitation, InvitationStatusEnum } = require('./models/invitation');
 */
module.exports = {
  IInvitation,
  InvitationStatusEnum,
  InvitationStatusFlow,
  INVITATION_DEFAULT_EXPIRE_HOURS
};
