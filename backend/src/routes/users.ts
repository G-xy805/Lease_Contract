import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { loginRateLimit, codeRateLimit, globalRateLimit } from '../middleware/rateLimit';
import { validationMiddleware, combineValidations } from '../middleware/validation';
import {
  wechatLogin,
  phoneLogin,
  sendCode,
  getProfile,
  updateProfile,
  realNameVerify,
  applyLessor,
  auditLessor,
  banUser,
  unbanUser
} from '../controllers/usersController';

const router = Router();

// 全局速率限制 - 每IP每分钟最多60次请求
router.use(globalRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: '请求过于频繁，请稍后再试'
}));

// 验证码速率限制
const sendCodeRateLimit = codeRateLimit();

// 登录速率限制
const loginRateLimitMiddleware = loginRateLimit();

/**
 * 微信登录
 * POST /api/users/wechat-login
 */
router.post('/wechat-login', loginRateLimitMiddleware, validationMiddleware.preventSqlInjection, wechatLogin);

/**
 * 手机号登录（验证码登录）
 * POST /api/users/phone-login
 */
router.post('/phone-login', loginRateLimitMiddleware, combineValidations(
  validationMiddleware.validatePhone,
  validationMiddleware.validateCode,
  validationMiddleware.preventSqlInjection
), phoneLogin);

/**
 * 发送验证码（本地开发用模拟）
 * POST /api/users/send-code
 */
router.post('/send-code', sendCodeRateLimit, combineValidations(
  validationMiddleware.validatePhone,
  validationMiddleware.preventSqlInjection
), sendCode);

/**
 * 获取用户信息（需认证）
 * GET /api/users/profile
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * 更新用户信息（需认证）
 * PUT /api/users/profile
 */
router.put('/profile', authMiddleware, combineValidations(
  validationMiddleware.validateName,
  validationMiddleware.preventSqlInjection
), updateProfile);

/**
 * 实名认证（需认证，本地开发用模拟）
 * POST /api/users/real-name/verify
 */
router.post('/real-name/verify', authMiddleware, combineValidations(
  validationMiddleware.validateName,
  validationMiddleware.validateIdCard,
  validationMiddleware.preventSqlInjection
), realNameVerify);

/**
 * 申请成为甲方
 * POST /api/users/apply-lessor
 */
router.post('/apply-lessor', authMiddleware, applyLessor);

/**
 * 管理员审核甲方申请
 * POST /api/users/audit-lessor
 */
router.post('/audit-lessor', authMiddleware, validationMiddleware.preventSqlInjection, auditLessor);

/**
 * 管理员封禁用户
 * POST /api/users/:id/ban
 */
router.post('/:id/ban', authMiddleware, combineValidations(
  validationMiddleware.validateUserId,
  validationMiddleware.preventSqlInjection
), banUser);

/**
 * 管理员解封用户
 * POST /api/users/:id/unban
 */
router.post('/:id/unban', authMiddleware, combineValidations(
  validationMiddleware.validateUserId,
  validationMiddleware.preventSqlInjection
), unbanUser);

export default router;
