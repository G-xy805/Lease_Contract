import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  sendSignInviteNotification,
  sendSignCompleteNotification
} from '../controllers/invitationsController';

const router = Router();

/**
 * POST /api/notifications/send-sign-invite
 * 发送签署邀请通知（模拟）
 * 需要认证
 */
router.post('/send-sign-invite', authMiddleware, sendSignInviteNotification);

/**
 * POST /api/notifications/send-sign-complete
 * 发送签署完成通知（模拟）
 * 需要认证
 */
router.post('/send-sign-complete', authMiddleware, sendSignCompleteNotification);

export default router;
