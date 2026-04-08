import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import {
  wechatLogin,
  phoneLogin,
  sendCode,
  getProfile,
  updateProfile,
  realNameVerify
} from '../controllers/usersController';

const router = Router();

const sendCodeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 3,
  message: '发送验证码过于频繁，请60秒后再试'
});

/**
 * 微信登录
 * POST /api/users/wechat-login
 */
router.post('/wechat-login', wechatLogin);

/**
 * 手机号登录（验证码登录）
 * POST /api/users/phone-login
 */
router.post('/phone-login', phoneLogin);

/**
 * 发送验证码（本地开发用模拟）
 * POST /api/users/send-code
 */
router.post('/send-code', sendCodeRateLimit, sendCode);

/**
 * 获取用户信息（需认证）
 * GET /api/users/profile
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * 更新用户信息（需认证）
 * PUT /api/users/profile
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * 实名认证（需认证，本地开发用模拟）
 * POST /api/users/real-name/verify
 */
router.post('/real-name/verify', authMiddleware, realNameVerify);

export default router;
