/**
 * 用户信息接口定义
 * 对应数据库 users 表
 * @module models/user
 */

/**
 * 用户信息接口（IUserInfo）
 * 包含用户基本信息、角色、实名认证状态等
 */
const IUserInfo = {
  // 基础标识字段
  id: null,                    // 用户ID (INTEGER, 主键, 自增)
  openid: null,                // 微信OpenID (VARCHAR(64), 唯一, 可为空)
  phone: null,                 // 手机号码 (VARCHAR(20), 必填, 唯一, 登录账号)

  // 个人信息字段
  name: null,                  // 真实姓名 (VARCHAR(50), 可为空)
  idcard: null,                // 身份证号 (VARCHAR(18), 可为空, 加密存储)

  // 角色和状态字段
  role: null,                  // 用户角色 (VARCHAR(20)): 'LESSOR' | 'LESSEE' | 'ADMIN'
  status: null,                // 账号状态 (INTEGER): 0-正常, 1-封禁

  // 实名字段
  real_name_status: null,      // 实名认证状态 (INTEGER): 0-未认证, 1-认证中, 2-已认证, 3-失败
  real_name_at: null,          // 实名认证通过时间 (DATETIME)

  // 时间戳字段
  created_at: null,            // 创建时间 (DATETIME)
  updated_at: null             // 更新时间 (DATETIME)
};

/**
 * 用户角色枚举值说明
 */
const UserRoleEnum = {
  LESSOR: 'LESSOR',            // 房东/甲方 - 出租方
  LESSEE: 'LESSEE',            // 租客/乙方 - 承租方
  ADMIN: 'ADMIN'               // 管理员 - 系统管理
};

/**
 * 实名认证状态枚举值说明
 */
const RealNameStatusEnum = {
  NOT_AUTH: 0,                 // 未认证
  AUTHENTICATING: 1,           // 认证中
  AUTHENTICATED: 2,            // 已认证
  FAILED: 3                    // 认证失败
};

/**
 * 导出默认对象作为类型参考
 * 使用方式: const { IUserInfo } = require('./models/user');
 */
module.exports = {
  IUserInfo,
  UserRoleEnum,
  RealNameStatusEnum
};
