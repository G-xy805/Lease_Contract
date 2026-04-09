import { Request, Response } from 'express';
import { query, insert, execute } from '../database';
import { RowDataPacket } from 'mysql2';
import { AuthRequest } from '../middleware/auth';
import {
  ISignature,
  ISignatureResponse,
  ISignatureListResponse,
  ICreateSignature,
  SignatureRow,
  SignRole,
  SignStatus,
  ContractStatus,
  IContract
} from '../models/Signature';
import { UserRole } from '../models/User';

const isAdminUser = async (userId: number): Promise<boolean> => {
  const users = await query<RowDataPacket[]>('SELECT role FROM users WHERE id = ?', [userId]);
  return users.length > 0 && users[0].role === UserRole.ADMIN;
};

/**
 * 获取客户端IP地址
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * 获取客户端设备信息
 */
const getClientDevice = (req: Request): string => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  return userAgent;
};

/**
 * 格式化签署记录响应
 */
const formatSignatureResponse = (signature: ISignature): ISignatureResponse => {
  return {
    id: signature.id,
    contract_id: signature.contract_id,
    user_id: signature.user_id,
    sign_role: signature.sign_role,
    sign_name: signature.sign_name,
    sign_phone: signature.sign_phone,
    signature_data: signature.signature_data,
    sign_status: signature.sign_status,
    ip_address: signature.ip_address,
    device_info: signature.device_info,
    sign_location: signature.sign_location,
    signed_at: signature.signed_at
  };
};

/**
 * POST /api/signatures
 * 创建签署记录
 */
export const createSignature = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      contract_id,
      sign_role,
      sign_name,
      sign_phone,
      signature_data,
      sign_location
    } = req.body as ICreateSignature;

    // 参数验证
    if (!contract_id || !sign_role || !signature_data) {
      res.status(400).json({
        code: 400,
        message: '缺少必要参数：contract_id、sign_role、signature_data'
      });
      return;
    }

    // 验证签署角色
    if (!Object.values(SignRole).includes(sign_role)) {
      res.status(400).json({
        code: 400,
        message: '无效的签署角色'
      });
      return;
    }

    // 验证签名图片Base64格式
    if (!signature_data.startsWith('data:image/')) {
      res.status(400).json({
        code: 400,
        message: '签名图片格式无效，应为Base64格式'
      });
      return;
    }

    // 查询合同信息
    const contracts = await query<IContract[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contract_id]
    );

    if (contracts.length === 0) {
      res.status(404).json({
        code: 404,
        message: '合同不存在'
      });
      return;
    }

    const contract = contracts[0];

    const isAdmin = userId ? await isAdminUser(userId) : false;
    if (sign_role === SignRole.LESSOR && !isAdmin && contract.created_by !== userId) {
      res.status(403).json({
        code: 403,
        message: '您不是该合同的甲方，无权签署'
      });
      return;
    }

    // 验证合同状态
    if (sign_role === SignRole.LESSOR && contract.status !== ContractStatus.PENDING_LESSOR_SIGN) {
      res.status(400).json({
        code: 400,
        message: '合同状态不是待甲方签署状态'
      });
      return;
    }

    if (sign_role === SignRole.LESSEE && contract.status !== ContractStatus.PENDING_TENANT_SIGN) {
      res.status(400).json({
        code: 400,
        message: '合同状态不是待乙方签署状态'
      });
      return;
    }

    // 检查是否已签署
    const existingSignatures = await query<any[]>(
      'SELECT * FROM signatures WHERE contract_id = ? AND sign_role = ?',
      [contract_id, sign_role]
    );

    if (existingSignatures.length > 0) {
      res.status(400).json({
        code: 400,
        message: '您已在此合同上签署'
      });
      return;
    }

    // 获取签署留痕信息
    const signed_at = new Date().toISOString();
    const ip_address = getClientIp(req);
    const device_info = getClientDevice(req);

    // 确定签署人姓名和电话（优先使用传入值，否则从合同获取）
    const finalSignName = sign_name || (sign_role === SignRole.LESSOR ? contract.lessor_name : contract.lessee_name);
    const finalSignPhone = sign_phone || (sign_role === SignRole.LESSOR ? contract.lessor_phone : contract.lessee_phone);

    // 创建签署记录
    const result = await insert(
      `INSERT INTO signatures
       (contract_id, user_id, sign_role, sign_name, sign_phone, signature_data,
        sign_status, ip_address, device_info, sign_location, signed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contract_id,
        userId || null,
        sign_role,
        finalSignName,
        finalSignPhone,
        signature_data,
        SignStatus.CONFIRMED,
        ip_address,
        device_info,
        sign_location || null,
        signed_at,
        signed_at
      ]
    );

    // 更新合同状态
    let newStatus: ContractStatus;
    if (sign_role === SignRole.LESSOR) {
      newStatus = ContractStatus.PENDING_TENANT_SIGN;
    } else {
      newStatus = ContractStatus.SIGNED;
    }

    await execute(
      'UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?',
      [newStatus, signed_at, contract_id]
    );

    // 构建响应数据
    const response = {
      id: result.insertId,
      contract_id,
      sign_role,
      signed_at
    };

    console.log(`[签署记录] 用户 ${userId} 以 ${sign_role} 身份签署了合同 ${contract_id}`);

    res.json({
      code: 200,
      message: '签署成功',
      data: {
        ...response,
        contract_status: newStatus
      }
    });
  } catch (error) {
    console.error('[签署模块] 创建签署记录错误:', error);
    console.error('[签署模块] 错误详情:', {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.userId,
      contractId: req.body?.contract_id
    });
    res.status(500).json({
      code: 500,
      message: '创建签署记录失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : '未知错误' : undefined
    });
  }
};

/**
 * GET /api/signatures/:contract_id
 * 获取合同的签署记录
 */
export const getSignaturesByContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contract_id } = req.params;

    if (!contract_id) {
      console.warn('[签署模块] 缺少合同ID参数');
      res.status(400).json({
        code: 400,
        message: '合同ID不能为空'
      });
      return;
    }

    console.log(`[签署模块] 正在查询合同 ${contract_id} 的签署记录`);

    // 查询合同是否存在
    const contracts = await query<any[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contract_id]
    );

    if (contracts.length === 0) {
      console.warn(`[签署模块] 合同不存在，ID: ${contract_id}`);
      res.status(404).json({
        code: 404,
        message: '合同不存在'
      });
      return;
    }

    // 查询签署记录
    const signatures = await query<SignatureRow[]>(
      `SELECT * FROM signatures
       WHERE contract_id = ?
       ORDER BY signed_at ASC`,
      [contract_id]
    );

    console.log(`[签署模块] 找到 ${signatures.length} 条签署记录，合同ID: ${contract_id}`);

    // 转换签署记录格式
    const list: ISignatureResponse[] = signatures.map(formatSignatureResponse);

    const response: ISignatureListResponse = {
      total: list.length,
      list
    };

    res.json({
      code: 200,
      message: '获取成功',
      data: response
    });
  } catch (error) {
    console.error('[签署模块] 获取签署记录错误:', error);
    console.error('[签署模块] 错误详情:', {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      contractId: req.params.contract_id
    });
    res.status(500).json({
      code: 500,
      message: '获取签署记录失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : '未知错误' : undefined
    });
  }
};

/**
 * GET /api/signatures/detail/:id
 * 获取签署记录详情
 */
export const getSignatureById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      console.warn('[签署模块] 缺少签署记录ID参数');
      res.status(400).json({
        code: 400,
        message: '签署记录ID不能为空'
      });
      return;
    }

    console.log(`[签署模块] 正在查询签署记录ID: ${id}`);

    const signatures = await query<SignatureRow[]>(
      `SELECT * FROM signatures
       WHERE id = ?`,
      [id]
    );

    if (signatures.length === 0) {
      console.warn(`[签署模块] 签署记录不存在，ID: ${id}`);
      res.status(404).json({
        code: 404,
        message: '签署记录不存在'
      });
      return;
    }

    const signature = signatures[0];

    // 构建响应数据
    const response = formatSignatureResponse(signature);

    console.log(`[签署模块] 成功获取签署记录ID: ${id}`);

    res.json({
      code: 200,
      message: '获取成功',
      data: response
    });
  } catch (error) {
    console.error('[签署模块] 获取签署记录详情错误:', error);
    console.error('[签署模块] 错误详情:', {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      signatureId: req.params.id
    });
    res.status(500).json({
      code: 500,
      message: '获取签署记录详情失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : '未知错误' : undefined
    });
  }
};
