/**
 * 合同控制器层（Controller）
 * 
 * 核心职责：
 * 1. 接收和验证 HTTP 请求参数
 * 2. 调用 service 层处理业务逻辑
 * 3. 返回标准化 API 响应
 * 4. 错误处理和日志记录
 * 
 * 适配变更（Part B）：
 * - createContract: 增加日期组件必填校验，自动关联逻辑在 service 层
 * - getContractDetail: 增加 signStatus 和 signatures 字段
 * - contractList: 每条记录增加 signStatusSummary
 * - signContract (lessorSign/tenantSign): 写入 signatures 表
 * - API 响应格式向后兼容
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  // Service 层方法
  getContractListService,
  getContractByIdService,
  createContractService,
  updateContractService,
  deleteContractService,
  lessorSignService,
  tenantSignService,
  rejectContractService,
  cancelContractService,
  getContractSignStatus
} from '../services/contractService';

import { htmlPdfService, ContractData, PdfResult } from '../services/htmlPdfService';
import { contractConfig } from '../config/contractTemplate';
import {
  IContract,
  IContractCreate,
  IContractUpdate,
  IContractListResponse,
  IContractDetailResponse,
  IContractVerifyResponse,
  ContractRow,
  getStatusText,
  composeDateComponents
} from '../models/Contract';
import { ISignature } from '../models/Signature';
import { query, execute } from '../database';
import { RowDataPacket } from 'mysql2';

// ==================== 签署状态摘要类型定义 ====================

/**
 * 签署状态摘要（用于列表展示）
 */
interface SignStatusSummary {
  partyASigned: boolean;
  partyBSigned: boolean;
  currentStep: 'pending_lessor' | 'pending_lessee' | 'signed' | 'other';
}

/**
 * 合同详情扩展响应（包含签名信息）
 */
interface IContractDetailWithSignResponse extends IContractDetailResponse {
  signStatus?: {
    partyA: { signed: boolean; signedAt: Date | null; signature: string | null };
    partyB: { signed: boolean; signedAt: Date | null; signature: string | null };
    currentStep: string;
  };
  signatures?: ISignature[];
}

// ==================== 控制器方法实现 ====================

/**
 * GET /api/contracts/landlord
 * 获取甲方创建的合同列表
 * 
 * 变更点：
 * - 调用 service 层 getContractListService
 * - 可选：每条记录增加 signStatusSummary（性能考虑，默认不启用）
 */
export const getLandlordContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const response = await getContractListService({
      userId,
      role: 'landlord',
      status: req.query.status as string,
      keyword: req.query.keyword as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      page: parseInt(req.query.page as string, 10) || 1,
      page_size: parseInt(req.query.page_size as string, 10) || 10
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: response
    });
  } catch (error) {
    console.error('获取甲方合同列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * GET /api/contracts/tenant
 * 获取乙方签署的合同列表
 * 
 * 变更点：
 * - 调用 service 层 getContractListService
 * - 使用 lessee_user_id 和 partyB_phone 双重匹配
 */
export const getTenantContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId || !userPhone) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const response = await getContractListService({
      userId,
      userPhone,
      role: 'tenant',
      status: req.query.status as string,
      keyword: req.query.keyword as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      page: parseInt(req.query.page as string, 10) || 1,
      page_size: parseInt(req.query.page_size as string, 10) || 10
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: response
    });
  } catch (error) {
    console.error('获取乙方合同列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * GET /api/contracts/:id
 * 获取合同详情
 * 
 * 变更点（核心）：
 * - 响应体增加 `signStatus` 字段（调用 getContractSignStatus）
 * - 响应体增加 `signatures` 数组（签名详情列表）
 * - 从 signatures 表获取签名数据而非 contracts 表字段
 * - 使用日期组件组合为完整日期显示
 */
export const getContractById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId || !userPhone) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = parseInt(req.params.id, 10);
    
    if (isNaN(contractId)) {
      res.status(400).json({ code: 400, message: '无效的合同ID' });
      return;
    }

    // 调用 service 层获取合同详情和签名信息
    const result = await getContractByIdService(contractId, userId, userPhone);

    const { contract, signatures, signStatus } = result;

    // 构建合同数据用于 PDF 渲染（使用日期组件）
    let renderedContent = '';
    let itemsArray: Array<{ name: string; quantity?: string; unit?: string }> = [];

    // 解析物品清单 JSON
    if (contract.inventory_items) {
      try {
        const parsed = typeof contract.inventory_items === 'string'
          ? JSON.parse(contract.inventory_items)
          : contract.inventory_items;
        if (Array.isArray(parsed)) {
          itemsArray = parsed.map((item: any) => ({
            name: item.name || '',
            quantity: item.quantity?.toString() || '0',
            unit: item.unit || ''
          }));
        }
      } catch (e) {
        console.error('解析 inventory_items 失败:', e);
      }
    }

    // 组合日期组件为完整日期字符串（用于模板渲染）
    const startDateStr = contract.lease_start_year && contract.lease_start_month && contract.lease_start_day
      ? composeDateComponents(contract.lease_start_year, contract.lease_start_month, contract.lease_start_day).toISOString().split('T')[0]
      : '';

    const endDateStr = contract.lease_end_year && contract.lease_end_month && contract.lease_end_day
      ? composeDateComponents(contract.lease_end_year, contract.lease_end_month, contract.lease_end_day).toISOString().split('T')[0]
      : '';

    // 构建合同数据对象（注意：移除了旧的 lease_start/lease_end 字段引用）
    const contractData: ContractData = {
      id: contract.id.toString(),
      contractNumber: contract.contract_no,
      title: contract.title,
      partyA: {
        name: '甲方（出租方）',
        company: contract.partyA_company || contractConfig.partyACompany,
        contact: contract.partyA_contact || '',
        phone: contract.partyA_phone || '',
        address: contract.house_address,
        idCard: contract.partyA_idcard || '',
        account: contract.partyA_account || ''
      },
      partyB: {
        name: contract.partyB_name || '',
        contact: contract.partyB_contact || '',
        phone: contract.partyB_phone || '',
        address: '-',
        idCard: contract.partyB_idCard || ''
      },
      property: {
        address: contract.house_address,
        area: (contract.house_area || 0).toString(),
        roomType: '-'
      },
      rent: {
        amount: contract.monthly_rent,
        paymentCycle: contract.payment_method?.toString() || '1',
        deposit: contract.deposit,
        paymentDate: '每月1日',
        purpose: contract.rent_purpose || '居住使用'
      },
      duration: {
        startDate: startDateStr,  // 使用日期组件组合后的值
        endDate: endDateStr,      // 使用日期组件组合后的值
        totalMonths: contract.lease_months || 0
      },
      terms: [],
      createdAt: new Date(contract.created_at).toLocaleDateString('zh-CN'),
      advanceNoticeDays: contract.advance_notice_days || 30,
      paymentTimes: contract.payment_count || 1,
      firstPaymentAmount: contract.first_payment_amount || contract.monthly_rent,
      firstPaymentDate: '',  // 移除旧字段引用
      secondPaymentAmount: contract.second_payment_amount || contract.monthly_rent,
      secondPaymentDate: '',  // 移除旧字段引用
      thirdPaymentAmount: contract.third_payment_amount || 0,
      thirdPaymentDate: '',
      electricityMeter: contract.electricity_meter ?? '',
      waterMeter: contract.water_meter ?? '',
      gasMeter: contract.gas_meter ?? '',
      remark: contract.remark || '',
      lessorAccount: contract.partyA_account_for_rent || contract.partyA_account || '',
      intermediaryName: contract.intermediary_name || '',
      partyACommission: contract.partyA_commission || 0,
      partyACommissionChinese: contract.partyA_commission_chinese || '',
      partyBCommission: contract.partyB_commission || 0,
      partyBCommissionChinese: contract.partyB_commission_chinese || '',
      depositChinese: contract.deposit_chinese || '',
      partyBSignature: signStatus.partyB.signature || '',  // 从签名状态获取
      items: itemsArray
    };

    try {
      renderedContent = htmlPdfService.renderContractHtml(contractData);
    } catch (renderError) {
      console.error('渲染合同模板失败:', renderError);
      renderedContent = '';
    }

    // 构建扩展响应体（包含签名信息）
    const response: IContractDetailWithSignResponse = {
      contract: {
        ...contract,
        rendered_content: renderedContent
      } as IContract,
      // 新增：签署状态聚合
      signStatus,
      // 新增：签名记录列表
      signatures
    };

    res.json({
      code: 200,
      message: '获取成功',
      data: response
    });
  } catch (error) {
    console.error('获取合同详情错误:', error);
    
    // 区分业务错误和系统错误
    if (error instanceof Error) {
      if (error.message === '合同不存在') {
        res.status(404).json({ code: 404, message: error.message });
        return;
      }
      if (error.message === '无权查看此合同') {
        res.status(403).json({ code: 403, message: error.message });
        return;
      }
    }
    
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts
 * 创建合同（甲方）
 * 
 * 变更点（核心）：
 * - 请求体验证增加日期组件必填校验（lease_start_year/month/day 都必填）
 * - lessee_user_id 为可选，自动关联逻辑在 service 层处理
 * - partyB_phone 格式验证
 * - 移除对旧字段（invite_code, first_payment_date 等）的处理
 * - 调用 service 层 createContractService
 */
export const createContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const data = req.body as IContractCreate;

    // 1. 验证日期组件必填（新特性！）
    const {
      lease_start_year,
      lease_start_month,
      lease_start_day,
      lease_end_year,
      lease_end_month,
      lease_end_day
    } = data;

    if (!lease_start_year || !lease_start_month || !lease_start_day) {
      res.status(400).json({
        code: 400,
        message: '缺少租赁开始日期组件：lease_start_year、lease_start_month、lease_start_day 都是必填项'
      });
      return;
    }

    if (!lease_end_year || !lease_end_month || !lease_end_day) {
      res.status(400).json({
        code: 400,
        message: '缺少租赁结束日期组件：lease_end_year、lease_end_month、lease_end_day 都是必填项'
      });
      return;
    }

    // 2. 验证 partyB_phone 格式（必填且格式正确）
    if (!data.partyB_phone) {
      res.status(400).json({ code: 400, message: '缺少必填参数：partyB_phone' });
      return;
    }

    // 3. 调用 service 层创建合同（所有验证逻辑在 service 层统一处理）
    const contract = await createContractService(userId, data);

    const response: IContractDetailResponse = {
      contract
    };

    res.status(201).json({
      code: 201,
      message: '创建成功',
      data: response
    });
  } catch (error) {
    console.error('创建合同错误:', error);
    
    // 返回业务验证错误的具体信息
    if (error instanceof Error) {
      res.status(400).json({ code: 400, message: error.message });
      return;
    }
    
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * PUT /api/contracts/:id
 * 更新合同（草稿状态）
 * 
 * 变更点：
 * - 支持所有新字段更新（包括日期组件）
 * - 调用 service 层 updateContractService
 * - 日期组件自动组合验证在 service 层
 */
export const updateContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = parseInt(req.params.id, 10);
    const updateData = req.body as IContractUpdate;

    if (isNaN(contractId)) {
      res.status(400).json({ code: 400, message: '无效的合同ID' });
      return;
    }

    // 调用 service 层更新合同
    const updatedContract = await updateContractService(contractId, userId, updateData);

    const response: IContractDetailResponse = {
      contract: updatedContract
    };

    res.json({
      code: 200,
      message: '更新成功',
      data: response
    });
  } catch (error) {
    console.error('更新合同错误:', error);
    
    if (error instanceof Error) {
      if (error.message === '合同不存在') {
        res.status(404).json({ code: 404, message: error.message });
        return;
      }
      if (error.message === '无权修改此合同' || error.message.includes('不能修改')) {
        res.status(403).json({ code: 403, message: error.message });
        return;
      }
      res.status(400).json({ code: 400, message: error.message });
      return;
    }
    
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * DELETE /api/contracts/:id
 * 删除合同（草稿）
 */
export const deleteContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = parseInt(req.params.id, 10);

    if (isNaN(contractId)) {
      res.status(400).json({ code: 400, message: '无效的合同ID' });
      return;
    }

    // 调用 service 层删除合同
    await deleteContractService(contractId, userId);

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除合同错误:', error);
    
    if (error instanceof Error) {
      if (error.message === '合同不存在') {
        res.status(404).json({ code: 404, message: error.message });
        return;
      }
      if (error.message === '无权删除此合同' || error.message.includes('可以删除')) {
        res.status(403).json({ code: 403, message: error.message });
        return;
      }
    }
    
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts/:id/sign
 * 甲方签署合同
 * 
 * 变更点（核心！）：
 * - 写入 signatures 表（而非 contracts 表的 signature 字段）
 * - 使用新的 sign_role ('LESSOR') 和 sign_status (CONFIRMED=1) 字段
 * - 更新合同状态（PENDING_LESSOR_SIGN -> PENDING_LESSEE_SIGN）
 * - 不再设置 invite_code/invite_expires_at（由 sign_invitations 表管理）
 * - 记录 IP 地址和设备信息
 */
export const lessorSign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = parseInt(req.params.id, 10);
    const { signature } = req.body;

    if (!signature) {
      res.status(400).json({ code: 400, message: '请提供签名图片' });
      return;
    }

    if (isNaN(contractId)) {
      res.status(400).json({ code: 400, message: '无效的合同ID' });
      return;
    }

    // 获取客户端信息
    const ipAddress = req.ip || (Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : req.headers['x-forwarded-for']) || null;
    const userAgent = Array.isArray(req.headers['user-agent']) 
      ? req.headers['user-agent'][0] 
      : req.headers['user-agent'] || null;

    // 调用 service 层执行签署操作
    const result = await lessorSignService(
      contractId,
      userId,
      signature,
      ipAddress,
      userAgent
    );

    res.json({
      code: 200,
      message: '签署成功，请分享给乙方签署',
      data: {
        contract: result.contract,
        signature: result.signature
      }
    });
  } catch (error) {
    console.error('甲方签署合同错误:', error);
    
    if (error instanceof Error) {
      if (error.message === '合同不存在') {
        res.status(404).json({ code: 404, message: error.message });
        return;
      }
      if (error.message === '无权操作此合同') {
        res.status(403).json({ code: 403, message: error.message });
        return;
      }
      if (error.message.includes('不能签署')) {
        res.status(400).json({ code: 400, message: error.message });
        return;
      }
    }
    
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts/:id/share
 * 生成签署链接（甲方分享给乙方）
 * 
 * 注意：此接口需要配合 sign_invitations 表使用
 * 当前版本简化处理，实际应查询 sign_invitations 表获取邀请码
 */
export const shareContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = parseInt(req.params.id, 10);

    if (isNaN(contractId)) {
      res.status(400).json({ code: 400, message: '无效的合同ID' });
      return;
    }

    // 查询合同基本信息
    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    // 权限验证
    const isAdmin = await (async () => {
      const users = await query<RowDataPacket[]>('SELECT role FROM users WHERE id = ?', [userId]);
      return users.length > 0 && users[0].role === 'admin';
    })();

    if (!isAdmin && contract.created_by !== userId) {
      res.status(403).json({ code: 403, message: '无权操作此合同' });
      return;
    }

    // 状态验证
    if (contract.status !== 2) {  // PENDING_LESSEE_SIGN = 2
      res.status(400).json({
        code: 400,
        message: `当前状态[${getStatusText(contract.status)}]不能生成分享链接`
      });
      return;
    }

    // TODO: 应从 sign_invitations 表查询邀请码信息
    // 当前版本暂不支持此功能，需要实现 sign_invitations 相关逻辑
    res.status(501).json({
      code: 501,
      message: '功能开发中，请等待 sign_invitations 表相关接口完成'
    });
  } catch (error) {
    console.error('生成分享链接错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * GET /api/contracts/invite-verify/:code
 * 验证邀请码
 * 
 * 注意：应改为查询 sign_invitations 表
 */
export const verifyInviteCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({ code: 400, message: '请提供邀请码' });
      return;
    }

    // TODO: 应从 sign_invitations 表查询
    // 当前版本暂返回提示信息
    res.status(501).json({
      code: 501,
      message: '功能开发中，请等待 sign_invitations 表相关接口完成'
    });
  } catch (error) {
    console.error('验证邀请码错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts/:id/tenant-sign
 * 乙方签署合同
 * 
 * 变更点（核心！）：
 * - 写入 signatures 表（而非 contracts 表的 signature 字段）
 * - 使用新的 sign_role ('LESSEE') 和 sign_status (CONFIRMED=1) 字段
 * - 更新合同状态（PENDING_LESSEE_SIGN -> SIGNED）
 * - 设置 effective_at（当双方都签完后）
 * - 记录 IP 地址和设备信息
 */
export const tenantSign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId || !userPhone) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = parseInt(req.params.id, 10);
    const { signature } = req.body;

    if (!signature) {
      res.status(400).json({ code: 400, message: '请提供签名图片' });
      return;
    }

    if (isNaN(contractId)) {
      res.status(400).json({ code: 400, message: '无效的合同ID' });
      return;
    }

    // 获取客户端信息
    const ipAddress = req.ip || (Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : req.headers['x-forwarded-for']) || null;
    const userAgent = Array.isArray(req.headers['user-agent']) 
      ? req.headers['user-agent'][0] 
      : req.headers['user-agent'] || null;

    // 调用 service 层执行签署操作
    const result = await tenantSignService(
      contractId,
      userId,
      userPhone,
      signature,
      ipAddress,
      userAgent
    );

    res.json({
      code: 200,
      message: '签署成功，合同已生效',
      data: {
        contract: result.contract,
        signature: result.signature
      }
    });
  } catch (error) {
    console.error('乙方签署合同错误:', error);
    
    if (error instanceof Error) {
      if (error.message === '合同不存在') {
        res.status(404).json({ code: 404, message: error.message });
        return;
      }
      if (error.message === '您不是此合同的乙方签署人') {
        res.status(403).json({ code: 403, message: error.message });
        return;
      }
      if (error.message.includes('不能签署')) {
        res.status(400).json({ code: 400, message: error.message });
        return;
      }
    }
    
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts/:id/reject
 * 拒绝签署（乙方）
 */
export const rejectContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId || !userPhone) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    if (isNaN(contractId)) {
      res.status(400).json({ code: 400, message: '无效的合同ID' });
      return;
    }

    // 调用 service 层拒绝合同
    const updatedContract = await rejectContractService(contractId, userId, userPhone, reason);

    const response: IContractDetailResponse = {
      contract: updatedContract
    };

    res.json({
      code: 200,
      message: '已拒绝签署',
      data: response
    });
  } catch (error) {
    console.error('拒绝签署合同错误:', error);
    
    if (error instanceof Error) {
      if (error.message === '合同不存在') {
        res.status(404).json({ code: 404, message: error.message });
        return;
      }
      if (error.message === '您不是此合同的乙方签署人') {
        res.status(403).json({ code: 403, message: error.message });
        return;
      }
      if (error.message.includes('不能拒绝')) {
        res.status(400).json({ code: 400, message: error.message });
        return;
      }
    }
    
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts/:id/cancel
 * 取消合同
 */
export const cancelContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = parseInt(req.params.id, 10);

    if (isNaN(contractId)) {
      res.status(400).json({ code: 400, message: '无效的合同ID' });
      return;
    }

    // 调用 service 层取消合同
    const updatedContract = await cancelContractService(contractId, userId, userPhone);

    const response: IContractDetailResponse = {
      contract: updatedContract
    };

    res.json({
      code: 200,
      message: '合同已取消',
      data: response
    });
  } catch (error) {
    console.error('取消合同错误:', error);
    
    if (error instanceof Error) {
      if (error.message === '合同不存在') {
        res.status(404).json({ code: 404, message: error.message });
        return;
      }
      if (error.message === '无权操作此合同' || error.message.includes('不能取消')) {
        res.status(403).json({ code: 403, message: error.message });
        return;
      }
    }
    
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * GET /api/contracts/:id/pdf
 * 生成PDF
 * 
 * 变更点：
 * - 从 signatures 表获取签名数据（而非 contracts 表字段）
 * - 使用日期组件组合日期
 * - 移除旧字段引用（first_payment_date, second_payment_date 等）
 */
export const generateContractPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId || !userPhone) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = parseInt(req.params.id, 10);

    if (isNaN(contractId)) {
      res.status(400).json({ code: 400, message: '无效的合同ID' });
      return;
    }

    // 获取合同详情和签名信息
    const result = await getContractByIdService(contractId, userId, userPhone);
    const { contract, signStatus } = result;

    // 从签名状态获取签名图片（而非 contracts 表字段）
    const partyASignature = signStatus.partyA.signature || '';
    const partyBSignature = signStatus.partyB.signature || '';

    // 解析物品清单 JSON
    let itemsArray: Array<{ name: string; quantity?: string; unit?: string }> = [];
    if (contract.inventory_items) {
      try {
        const parsed = typeof contract.inventory_items === 'string'
          ? JSON.parse(contract.inventory_items)
          : contract.inventory_items;
        if (Array.isArray(parsed)) {
          itemsArray = parsed.map((item: any) => ({
            name: item.name || '',
            quantity: item.quantity?.toString() || '0',
            unit: item.unit || ''
          }));
        }
      } catch (e) {
        console.error('解析 inventory_items 失败:', e);
      }
    }

    // 组合日期组件
    const startDateStr = contract.lease_start_year && contract.lease_start_month && contract.lease_start_day
      ? composeDateComponents(contract.lease_start_year, contract.lease_start_month, contract.lease_start_day).toISOString().split('T')[0]
      : '';

    const endDateStr = contract.lease_end_year && contract.lease_end_month && contract.lease_end_day
      ? composeDateComponents(contract.lease_end_year, contract.lease_end_month, contract.lease_end_day).toISOString().split('T')[0]
      : '';

    // 构建合同数据对象
    const contractData: ContractData = {
      id: contract.id.toString(),
      contractNumber: contract.contract_no,
      title: contract.title,
      partyA: {
        name: '甲方（出租方）',
        company: contract.partyA_company || contractConfig.partyACompany,
        contact: contract.partyA_contact || '',
        phone: contract.partyA_phone || '',
        address: contract.house_address,
        idCard: contract.partyA_idcard || '',
        account: contract.partyA_account || ''
      },
      partyB: {
        name: contract.partyB_name || '',
        contact: contract.partyB_contact || '',
        phone: contract.partyB_phone || '',
        address: '-',
        idCard: contract.partyB_idCard || ''
      },
      property: {
        address: contract.house_address,
        area: (contract.house_area || 0).toString(),
        roomType: '-'
      },
      rent: {
        amount: contract.monthly_rent,
        paymentCycle: contract.payment_method?.toString() || '1',
        deposit: contract.deposit,
        paymentDate: '每月1日',
        purpose: contract.rent_purpose || '居住使用'
      },
      duration: {
        startDate: startDateStr,
        endDate: endDateStr,
        totalMonths: contract.lease_months || 0
      },
      terms: [
        '甲方将位于上述地址的房屋出租给乙方使用。',
        '租赁期内，乙方应按时支付租金，逾期未付的，甲方有权终止合同。',
        '乙方应妥善使用房屋及设施，不得擅自转租或改变房屋结构。',
        '合同期满后，乙方应将房屋恢复原状并交还甲方。',
        '本合同一式两份，甲乙双方各执一份，具有同等法律效力。'
      ],
      createdAt: new Date(contract.created_at).toLocaleDateString('zh-CN'),
      advanceNoticeDays: contract.advance_notice_days || 30,
      paymentTimes: contract.payment_count || 1,
      firstPaymentAmount: contract.first_payment_amount || contract.monthly_rent,
      firstPaymentDate: '',  // 移除旧字段
      secondPaymentAmount: contract.second_payment_amount || contract.monthly_rent,
      secondPaymentDate: '',  // 移除旧字段
      thirdPaymentAmount: contract.third_payment_amount || 0,
      thirdPaymentDate: '',
      electricityMeter: contract.electricity_meter ?? '',
      waterMeter: contract.water_meter ?? '',
      gasMeter: contract.gas_meter ?? '',
      remark: contract.remark || '',
      lessorAccount: contract.partyA_account_for_rent || contract.partyA_account || '',
      intermediaryName: contract.intermediary_name || '',
      partyACommission: contract.partyA_commission || 0,
      partyACommissionChinese: contract.partyA_commission_chinese || '',
      partyBCommission: contract.partyB_commission || 0,
      partyBCommissionChinese: contract.partyB_commission_chinese || '',
      depositChinese: contract.deposit_chinese || '',
      partyBSignature: partyBSignature,
      items: itemsArray
    };

    const pdfResult: PdfResult = await htmlPdfService.generateContractPdf(contractData);

    if (!pdfResult.success || !pdfResult.filePath) {
      res.status(500).json({ code: 500, message: 'PDF生成失败' });
      return;
    }

    // 更新合同的 PDF 路径
    const existingContract = await query<ContractRow[]>(
      "SELECT contract_pdf_path FROM contracts WHERE id = ? AND contract_pdf_path IS NOT NULL AND contract_pdf_path != ''",
      [contractId]
    );

    if (existingContract.length === 0) {
      await execute(
        'UPDATE contracts SET contract_pdf_path = ?, updated_at = ? WHERE id = ?',
        [`uploads/pdfs/${pdfResult.filename}`, new Date().toISOString(), contractId]
      );
    }

    res.json({
      code: 200,
      message: 'PDF生成成功',
      data: {
        filename: pdfResult.filename,
        url: `/uploads/pdfs/${pdfResult.filename}`
      }
    });
    console.log(`[PDF] 生成成功, URL: /uploads/pdfs/${pdfResult.filename}`);
  } catch (error) {
    console.error('生成PDF错误:', error);
    
    if (error instanceof Error) {
      if (error.message === '合同不存在') {
        res.status(404).json({ code: 404, message: error.message });
        return;
      }
      if (error.message === '无权查看此合同') {
        res.status(403).json({ code: 403, message: error.message });
        return;
      }
    }
    
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * GET /api/contracts/verify/:code
 * 验证合同真伪
 */
export const verifyContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      const response: IContractVerifyResponse = {
        valid: false,
        message: '请提供合同编号'
      };
      res.json({ code: 200, message: '验证结果', data: response });
      return;
    }

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE contract_no = ?',
      [code]
    );

    if (contracts.length === 0) {
      const response: IContractVerifyResponse = {
        valid: false,
        message: '合同不存在，请核实合同编号'
      };
      res.json({ code: 200, message: '验证结果', data: response });
      return;
    }

    const contract = contracts[0];

    const response: IContractVerifyResponse = {
      valid: true,
      contract: {
        ...contract
      },
      message: '合同真实有效'
    };

    res.json({
      code: 200,
      message: '验证成功',
      data: response
    });
  } catch (error) {
    console.error('验证合同错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
