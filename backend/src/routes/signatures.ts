import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createSignature,
  getSignaturesByContract,
  getSignatureById
} from '../controllers/signaturesController';

const router = Router();

/**
 * 创建签署记录
 * POST /api/signatures
 * 需要认证
 * 请求体：
 * {
 *   contract_id: number,      // 合同ID
 *   sign_type: string,        // 签署类型：hand_write | image_upload | digital
 *   sign_role: string,         // 签署角色：lessor | tenant
 *   sign_image: string,        // 签名图片Base64
 *   sign_data?: string,       // 签名数据（可选）
 *   sign_location?: string    // 签署地理位置（可选）
 * }
 */
router.post('/', authMiddleware, createSignature);

/**
 * 获取合同的签署记录
 * GET /api/signatures/:contract_id
 * 需要认证
 */
router.get('/:contract_id', authMiddleware, getSignaturesByContract);

/**
 * 获取签署记录详情
 * GET /api/signatures/detail/:id
 * 需要认证
 */
router.get('/detail/:id', authMiddleware, getSignatureById);

export default router;
