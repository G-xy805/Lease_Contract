import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createInvitation,
  getReceivedInvitations,
  getContractByInviteCode,
  acceptInvitation,
  rejectInvitation
} from '../controllers/invitationsController';

const router = Router();

/**
 * POST /api/invitations
 * 创建签署邀请
 * 需要认证
 */
router.post('/', authMiddleware, createInvitation);

/**
 * GET /api/invitations
 * 获取收到的签署邀请列表
 * 需要认证
 */
router.get('/', authMiddleware, getReceivedInvitations);

/**
 * GET /api/invitations/:code
 * 通过邀请码获取合同信息
 * 无需认证（乙方通过邀请链接访问）
 */
router.get('/:code', getContractByInviteCode);

/**
 * POST /api/invitations/:code/accept
 * 接受签署邀请（乙方）
 * 无需认证（通过手机号验证身份）
 */
router.post('/:code/accept', acceptInvitation);

/**
 * POST /api/invitations/:code/reject
 * 拒绝签署邀请（乙方）
 * 无需认证（通过手机号验证身份）
 */
router.post('/:code/reject', rejectInvitation);

export default router;
