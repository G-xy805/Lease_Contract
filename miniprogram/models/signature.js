/**
 * 签名记录接口定义
 * 对应数据库 signatures 表
 * @module models/signature
 */

/**
 * 签名记录接口（ISignature）
 * 用于存储电子签名记录，支持甲方/乙方双方签署
 *
 * v2 新增字段:
 * - sign_role: 明确标识签署方角色（'LESSOR' 或 'LESSEE'）
 * - sign_status: 签署状态跟踪（0:待确认, 1:已确认, 2:已撤销）
 */
const ISignature = {
  // 基础标识字段
  id: null,                    // 主键ID (INTEGER, 自增)
  contract_id: null,           // 关联合同ID (INTEGER, FK→contracts.id, 必填)

  // 用户关联字段
  user_id: null,               // 签署用户ID (INTEGER, FK→users.id, 可为NULL - 未注册时)

  // 签署角色和身份字段 ⭐v2新增/优化
  sign_role: null,             // 签署角色 (VARCHAR(10), 必填): 'LESSOR' | 'LESSEE'
  sign_name: null,             // 签署人真实姓名 (VARCHAR(100), 必填)
  sign_phone: null,            // 签署人手机号 (VARCHAR(20), 可为空)

  // 签名数据字段
  signature_data: null,        // 签名图片数据 (TEXT, 必填) - Base64编码或文件路径

  // 签署状态字段 ⭐v2新增
  /**
   * 签署状态 (INTEGER, 默认: 1, 范围: 0-2)
   * 状态流转:
   *   0: 待确认（刚提交，等待审核/确认）
   *     └─→ 1: 已确认（用户确认签名，最终签署完成）
   *     └─→ 2: 已撤销（用户主动撤回签名）
   */
  sign_status: null,           // 0-待确认 | 1-已确认 | 2-已撤销

  // 审计追踪字段（用于法律效力和安全记录）
  ip_address: null,            // 签署时IP地址 (VARCHAR(50)) - 审计追踪
  device_info: null,           // 设备信息 (VARCHAR(255)) - User-Agent等
  sign_location: null,         // 签署地理位置 (VARCHAR(255)) - GPS坐标

  // 时间戳字段
  signed_at: null,             // 签署时间 (DATETIME, 必填)
  created_at: null             // 创建时间 (DATETIME)
};

/**
 * 签署角色枚举值说明（SignRole）
 */
const SignRoleEnum = {
  LESSOR: 'LESSOR',            // 甲方/出租方 - 房东签署
  LESSEE: 'LESSEE'             // 乙方/承租方 - 租客签署
};

/**
 * 签署状态枚举值说明（SignStatus）及流转规则
 */
const SignStatusEnum = {
  PENDING: 0,                  // 待确认 - 刚提交签名，等待最终确认
  CONFIRMED: 1,                // 已确认 - 用户确认签名，签署流程完成
  REVOKED: 2                   // 已撤销 - 用户主动撤回签名
};

/**
 * SignStatus 合法流转规则
 */
const SignStatusFlow = {
  [SignStatusEnum.PENDING]: [SignStatusEnum.CONFIRMED, SignStatusEnum.REVOKED],
  [SignStatusEnum.CONFIRMED]: [],  // 终态，不可再流转
  [SignStatusEnum.REVOKED]: []     // 终态，不可再流转
};

/**
 * 导出默认对象作为类型参考
 * 使用方式: const { ISignature, SignRoleEnum, SignStatusEnum } = require('./models/signature');
 */
module.exports = {
  ISignature,
  SignRoleEnum,
  SignStatusEnum,
  SignStatusFlow
};
