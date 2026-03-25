import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getLandlordContracts,
  getTenantContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  lessorSign,
  tenantSign,
  shareContract,
  verifyInviteCode,
  rejectContract,
  cancelContract,
  generateContractPdf,
  verifyContract
} from '../controllers/contractsController';

const router = Router();

/**
 * GET /api/contracts/landlord
 * 获取甲方创建的合同列表（需认证）
 */
router.get('/landlord', authMiddleware, getLandlordContracts);

/**
 * GET /api/contracts/tenant
 * 获取乙方签署的合同列表（需认证）
 */
router.get('/tenant', authMiddleware, getTenantContracts);

/**
 * GET /api/contracts/verify/:code
 * 验证合同真伪（无需认证）
 */
router.get('/verify/:code', verifyContract);

/**
 * GET /api/contracts/invite-verify/:code
 * 验证邀请码（无需认证）
 */
router.get('/invite-verify/:code', verifyInviteCode);

/**
 * GET /api/contracts/:id
 * 获取合同详情（需认证）
 */
router.get('/:id', authMiddleware, getContractById);

/**
 * POST /api/contracts
 * 创建合同（甲方，需认证）
 * 状态默认为 PENDING_LESSOR_SIGN (1)
 */
router.post('/', authMiddleware, createContract);

/**
 * PUT /api/contracts/:id
 * 更新合同（待签署状态，需认证）
 */
router.put('/:id', authMiddleware, updateContract);

/**
 * DELETE /api/contracts/:id
 * 删除合同（待签署状态，需认证）
 */
router.delete('/:id', authMiddleware, deleteContract);

/**
 * POST /api/contracts/:id/sign
 * 甲方签署合同（需认证）
 * - 验证合同状态为 PENDING_LESSOR_SIGN (1)
 * - 接收 signature (Base64图片) 参数
 * - 更新 lessor_sign_status, lessor_signed_at, lessor_signature
 * - 生成 invite_code 和 invite_expires_at
 * - 状态改为 PENDING_LESSEE_SIGN (2)
 */
router.post('/:id/sign', authMiddleware, lessorSign);

/**
 * POST /api/contracts/:id/share
 * 生成分享链接（需认证）
 * - 验证合同状态为 PENDING_LESSEE_SIGN (2)
 * - 返回 invite_code, share_url, qr_code, expires_at
 */
router.post('/:id/share', authMiddleware, shareContract);

/**
 * POST /api/contracts/:id/tenant-sign
 * 乙方签署合同（需认证）
 * - 验证 invite_code 有效且未过期
 * - 验证合同状态为 PENDING_LESSEE_SIGN (2)
 * - 接收 signature (Base64图片) 参数
 * - 更新 lessee_sign_status, lessee_signed_at, lessee_signature, sign_date
 * - 状态改为 SIGNED (3)
 * - 设置 effective_at
 */
router.post('/:id/tenant-sign', authMiddleware, tenantSign);

/**
 * POST /api/contracts/:id/reject
 * 拒绝签署（乙方，需认证）
 */
router.post('/:id/reject', authMiddleware, rejectContract);

/**
 * POST /api/contracts/:id/cancel
 * 取消合同（需认证）
 */
router.post('/:id/cancel', authMiddleware, cancelContract);

/**
 * GET /api/contracts/:id/pdf
 * 生成合同PDF（需认证）
 */
router.get('/:id/pdf', authMiddleware, generateContractPdf);

export default router;
