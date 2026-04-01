import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, insert, execute } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthRequest } from '../middleware/auth';
import { htmlPdfService, ContractData, PdfResult } from '../services/htmlPdfService';
import { contractConfig, defaultFeeConfig } from '../config/contractTemplate';
import {
  ContractStatus,
  PaymentMethod,
  IContract,
  IContractCreate,
  IContractUpdate,
  IContractListResponse,
  IContractDetailResponse,
  IContractVerifyResponse,
  ContractRow,
  canTransitionTo,
  getStatusText,
  getPaymentMethodText
} from '../models/Contract';
import { validateIdCard, validatePhone, validateAmount } from '../utils/validation';
import { UserRole } from '../models/User';

const isAdminUser = async (userId: number): Promise<boolean> => {
  const users = await query<RowDataPacket[]>('SELECT role FROM users WHERE id = ?', [userId]);
  return users.length > 0 && users[0].role === UserRole.ADMIN;
};

/**
 * 生成合同编号
 */
const generateContractNo = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LC${year}${month}${day}${random}`;
};

/**
 * 生成邀请码 (格式：LC{年月日}{6位随机字符})
 */
const generateInviteCode = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LC${year}${month}${day}${random}`;
};

/**
 * 计算合同总金额
 * 计算公式：总金额 = 月租金 × 租期月数 + 押金
 * 其中押金固定为1个月租金
 * 使用整数运算（分）避免浮点数精度问题
 */
const calculateTotalAmount = (monthlyRent: number, paymentMethod: PaymentMethod, months: number): number => {
  const depositsCount = 1;
  const monthlyRentFen = Math.round(monthlyRent * 100);
  const totalRentFen = monthlyRentFen * months;
  const depositFen = monthlyRentFen * depositsCount;
  return (totalRentFen + depositFen) / 100;
};

/**
 * GET /api/contracts/landlord
 * 获取甲方创建的合同列表
 */
export const getLandlordContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const {
      status,
      keyword,
      start_date,
      end_date,
      page = 1,
      page_size = 10
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(page_size as string, 10) || 10;
    const offset = (pageNum - 1) * pageSize;

    let whereClause = 'WHERE created_by = ?';
    const params: any[] = [userId];

    if (status) {
      const statusStr = status as string;
      if (statusStr.includes(',')) {
        const statusList = statusStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (statusList.length > 0) {
          whereClause += ` AND status IN (${statusList.map(() => '?').join(',')})`;
          params.push(...statusList);
        }
      } else {
        whereClause += ' AND status = ?';
        params.push(parseInt(statusStr, 10));
      }
    }

    if (keyword) {
      whereClause += ' AND (title LIKE ? OR contract_no LIKE ? OR partyB_name LIKE ? OR house_address LIKE ?)';
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword, searchKeyword);
    }

    if (start_date) {
      whereClause += ' AND lease_start >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND lease_end <= ?';
      params.push(end_date);
    }

    const countResult = await query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM contracts ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const listResult = await query<ContractRow[]>(
      `SELECT * FROM contracts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const list = listResult.map(contract => ({
      ...contract
    }));

    const response: IContractListResponse = {
      total,
      page: pageNum,
      page_size: pageSize,
      list
    };

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
 */
export const getTenantContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId || !userPhone) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const {
      status,
      keyword,
      start_date,
      end_date,
      page = 1,
      page_size = 10
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(page_size as string, 10) || 10;
    const offset = (pageNum - 1) * pageSize;

    let whereClause = 'WHERE (partyB_phone = ? OR created_by = ?)';
    const params: any[] = [userPhone, userId];

    if (status) {
      const statusStr = status as string;
      if (statusStr.includes(',')) {
        const statusList = statusStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (statusList.length > 0) {
          whereClause += ` AND status IN (${statusList.map(() => '?').join(',')})`;
          params.push(...statusList);
        }
      } else {
        whereClause += ' AND status = ?';
        params.push(parseInt(statusStr, 10));
      }
    }

    if (keyword) {
      whereClause += ' AND (title LIKE ? OR contract_no LIKE ? OR partyA_company LIKE ? OR house_address LIKE ?)';
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword, searchKeyword);
    }

    if (start_date) {
      whereClause += ' AND lease_start >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND lease_end <= ?';
      params.push(end_date);
    }

    const countResult = await query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM contracts ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const listResult = await query<ContractRow[]>(
      `SELECT * FROM contracts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const list = listResult.map(contract => ({
      ...contract
    }));

    const response: IContractListResponse = {
      total,
      page: pageNum,
      page_size: pageSize,
      list
    };

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
 */
export const getContractById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId || !userPhone) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = req.params.id;

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin && contract.created_by !== userId && contract.partyB_phone !== userPhone) {
      res.status(403).json({ code: 403, message: '无权查看此合同' });
      return;
    }

    let renderedContent = '';
    try {
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
          startDate: contract.lease_start ? new Date(contract.lease_start).toISOString().split('T')[0] : '',
          endDate: contract.lease_end ? new Date(contract.lease_end).toISOString().split('T')[0] : '',
          totalMonths: contract.lease_months || 0
        },
        terms: [],
        createdAt: new Date(contract.created_at).toLocaleDateString('zh-CN'),
        advanceNoticeDays: contract.advance_notice_days || 30,
        paymentTimes: contract.payment_count || 1,
        firstPaymentAmount: contract.first_payment_amount || contract.monthly_rent,
        firstPaymentDate: contract.first_payment_date || '',
        secondPaymentAmount: contract.second_payment_amount || contract.monthly_rent,
        secondPaymentDate: contract.second_payment_date ? new Date(contract.second_payment_date).toISOString().split('T')[0] : '',
        thirdPaymentAmount: contract.third_payment_amount || 0,
        thirdPaymentDate: '',
        electricityMeter: contract.electricity_meter ?? '',
        waterMeter: contract.water_meter ?? '',
        gasMeter: contract.gas_meter ?? '',
        remark: contract.remark || '',
        lessorAccount: contract.partyA_account || '',
        intermediaryName: contract.intermediary_name || '',
        partyACommission: contract.partyA_commission || 0,
        partyBCommission: contract.partyB_commission || 0,
        depositChinese: contract.deposit_chinese || '',
        partyBSignature: contract.partyB_signature || '',
        items: itemsArray
      };

      renderedContent = htmlPdfService.renderContractHtml(contractData);
    } catch (renderError) {
      console.error('渲染合同模板失败:', renderError);
    }

    const response: IContractDetailResponse = {
      contract: {
        ...contract,
        rendered_content: renderedContent
      } as IContract
    };

    res.json({
      code: 200,
      message: '获取成功',
      data: response
    });
  } catch (error) {
    console.error('获取合同详情错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts
 * 创建合同（甲方）
 * 状态默认为 PENDING_LESSOR_SIGN (1)
 */
export const createContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const {
      title,
      partyA_company,
      partyA_contact,
      partyA_phone,
      partyA_phone2,
      partyA_idcard,
      partyA_account,
      partyB_name,
      partyB_phone,
      partyB_idCard,
      partyB_contact,
      house_address,
      house_area,
      rent_purpose,
      lease_start,
      lease_end,
      lease_months,
      advance_notice_days,
      monthly_rent,
      payment_method,
      payment_cycle,
      payment_count,
      first_payment_amount,
      first_payment_date,
      second_payment_amount,
      second_payment_date,
      third_payment_amount,
      fourth_payment_amount,
      deposit,
      deposit_chinese,
      fee_items,
      partyA_commission,
      partyA_commission_chinese,
      partyB_commission,
      partyB_commission_chinese,
      electricity_meter,
      water_meter,
      gas_meter,
      remark,
      intermediary_name,
      inventory_items
    } = req.body as IContractCreate;

    if (!title || !partyA_company || !partyA_phone || !partyB_name || !partyB_phone ||
        !house_address || !lease_start || !lease_end || !monthly_rent) {
      res.status(400).json({ code: 400, message: '缺少必填参数' });
      return;
    }

    if (partyA_idcard && !validateIdCard(partyA_idcard)) {
      res.status(400).json({ code: 400, message: '甲方身份证号格式不正确' });
      return;
    }
    if (partyB_idCard && !validateIdCard(partyB_idCard)) {
      res.status(400).json({ code: 400, message: '乙方身份证号格式不正确' });
      return;
    }

    if (!validatePhone(partyA_phone)) {
      res.status(400).json({ code: 400, message: '甲方手机号格式不正确' });
      return;
    }
    if (!validatePhone(partyB_phone)) {
      res.status(400).json({ code: 400, message: '乙方手机号格式不正确' });
      return;
    }

    if (!validateAmount(monthly_rent)) {
      res.status(400).json({ code: 400, message: '月租金金额格式不正确' });
      return;
    }

    const startDate = new Date(lease_start);
    const endDate = new Date(lease_end);
    const calculatedMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    if (calculatedMonths <= 0) {
      res.status(400).json({ code: 400, message: '租赁结束日期必须晚于开始日期' });
      return;
    }

    const months = lease_months && lease_months > 0 ? lease_months : calculatedMonths;

    // 自动计算 year_rent
    const calculatedYearRent = monthly_rent * 12;

    // 计算 total_amount
    const total_amount = calculateTotalAmount(monthly_rent, payment_method || PaymentMethod.PAY_ONE_MONTH, months);
    const contract_no = generateContractNo();
    const now = new Date().toISOString();

    // 处理物品清单：如果前端传来 inventory_items 数组，序列化为 JSON 存入 inventory_items
    let inventoryItemsJson = null;
    if (inventory_items && Array.isArray(inventory_items)) {
      inventoryItemsJson = JSON.stringify(inventory_items);
    }

    // 状态默认为 PENDING_LESSOR_SIGN (1)
    const status = ContractStatus.PENDING_LESSOR_SIGN;

    const insertColumns = [
      'contract_no', 'title', 'lessor_user_id',
      'partyA_company', 'partyA_contact', 'partyA_phone', 'partyA_phone2', 'partyA_idcard', 'partyA_account',
      'partyB_name', 'partyB_phone', 'partyB_idCard', 'partyB_contact',
      'house_address', 'house_area', 'rent_purpose',
      'lease_start', 'lease_end', 'lease_months', 'advance_notice_days',
      'monthly_rent', 'year_rent', 'total_amount',
      'payment_method', 'payment_cycle', 'payment_count',
      'first_payment_amount', 'first_payment_date', 'second_payment_amount', 'second_payment_date',
      'third_payment_amount',
      'deposit', 'deposit_chinese',
      'fee_items',
      'partyA_commission', 'partyA_commission_chinese', 'partyB_commission', 'partyB_commission_chinese',
      'electricity_meter', 'water_meter', 'gas_meter',
      'remark', 'intermediary_name', 'inventory_items',
      'status', 'created_by', 'created_at', 'updated_at',
      'partyA_sign_status', 'partyB_sign_status'
    ];

    const feeItemsJson = fee_items && Array.isArray(fee_items) ? JSON.stringify(fee_items) : null;

    const insertValues = [
      contract_no, title, userId,
      partyA_company, partyA_contact || null, partyA_phone, partyA_phone2 || null, partyA_idcard || null, partyA_account || null,
      partyB_name, partyB_phone, partyB_idCard || null, partyB_contact || null,
      house_address, house_area || null, rent_purpose || null,
      lease_start, lease_end, months, advance_notice_days || null,
      monthly_rent, calculatedYearRent, total_amount,
      payment_method || PaymentMethod.PAY_ONE_MONTH, payment_cycle || null, payment_count || 1,
      first_payment_amount || null, first_payment_date || null, second_payment_amount || null, second_payment_date || null,
      third_payment_amount || null,
      deposit || monthly_rent, deposit_chinese || null,
      feeItemsJson,
      partyA_commission || null, partyA_commission_chinese || null, partyB_commission || null, partyB_commission_chinese || null,
      electricity_meter || null, water_meter || null, gas_meter || null,
      remark || null, intermediary_name || null, inventoryItemsJson,
      status, userId, now, now,
      0, 0
    ];

    const placeholders = insertColumns.map(() => '?').join(', ');

    await insert(
      `INSERT INTO contracts (${insertColumns.join(', ')}) VALUES (${placeholders})`,
      insertValues
    );

    const newContracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE contract_no = ?',
      [contract_no]
    );

    const contract = newContracts[0];

    const response: IContractDetailResponse = {
      contract: {
        ...contract
      }
    };

    res.status(201).json({
      code: 201,
      message: '创建成功',
      data: response
    });
  } catch (error) {
    console.error('创建合同错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * PUT /api/contracts/:id
 * 更新合同（草稿状态）
 */
export const updateContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = req.params.id;
    const updateData = req.body as IContractUpdate;

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin && contract.created_by !== userId) {
      res.status(403).json({ code: 403, message: '无权修改此合同' });
      return;
    }

    if (contract.status !== ContractStatus.PENDING_LESSOR_SIGN) {
      res.status(400).json({ code: 400, message: '只有待签署状态的合同可以修改' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields: (keyof IContractUpdate)[] = [
      'title',
      'partyA_company', 'partyA_contact', 'partyA_phone', 'partyA_phone2', 'partyA_idcard', 'partyA_account',
      'partyB_name', 'partyB_phone', 'partyB_idCard', 'partyB_contact',
      'house_address', 'house_area', 'rent_purpose',
      'lease_start', 'lease_end', 'lease_months', 'advance_notice_days',
      'monthly_rent', 'year_rent',
      'payment_method', 'payment_cycle', 'payment_count',
      'first_payment_amount', 'first_payment_date', 'second_payment_amount', 'second_payment_date',
      'third_payment_amount',
      'deposit', 'deposit_chinese',
      'fee_items',
      'partyA_commission', 'partyA_commission_chinese', 'partyB_commission', 'partyB_commission_chinese',
      'electricity_meter', 'water_meter', 'gas_meter',
      'remark', 'intermediary_name', 'inventory_items'
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === 'inventory_items' && Array.isArray(updateData[field])) {
          values.push(JSON.stringify(updateData[field]));
        } else if (field === 'fee_items' && Array.isArray(updateData[field])) {
          values.push(JSON.stringify(updateData[field]));
        } else {
          values.push(updateData[field]);
        }
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ code: 400, message: '没有需要更新的字段' });
      return;
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(contractId);

    await execute(
      `UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedContracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    const updatedContract = updatedContracts[0];

    const response: IContractDetailResponse = {
      contract: {
        ...updatedContract
      }
    };

    res.json({
      code: 200,
      message: '更新成功',
      data: response
    });
  } catch (error) {
    console.error('更新合同错误:', error);
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

    const contractId = req.params.id;

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin && contract.created_by !== userId) {
      res.status(403).json({ code: 403, message: '无权删除此合同' });
      return;
    }

    if (contract.status !== ContractStatus.PENDING_LESSOR_SIGN && 
        contract.status !== ContractStatus.PENDING_LESSEE_SIGN &&
        contract.status !== ContractStatus.REJECTED &&
        contract.status !== ContractStatus.CANCELLED) {
      res.status(400).json({ code: 400, message: '只有未生效的合同可以删除' });
      return;
    }

    await execute('DELETE FROM contracts WHERE id = ?', [contractId]);

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除合同错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts/:id/sign
 * 甲方签署合同
 * - 验证合同状态为 PENDING_LESSOR_SIGN (1)
 * - 接收 signature (Base64图片) 参数
 * - 更新 partyA_sign_status = 1, partyA_signed_at, partyA_signature
 * - 生成 invite_code 和 invite_expires_at (签署后7天)
 * - 状态改为 PENDING_LESSEE_SIGN (2)
 */
export const lessorSign = async (req: AuthRequest, res: Response): Promise<void> => {
  const contractId = req.params.id;

  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const { signature } = req.body;
    if (!signature) {
      res.status(400).json({ code: 400, message: '请提供签名图片' });
      return;
    }

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin && contract.created_by !== userId) {
      res.status(403).json({ code: 403, message: '无权操作此合同' });
      return;
    }

    if (contract.status !== ContractStatus.PENDING_LESSOR_SIGN) {
      res.status(400).json({
        code: 400,
        message: `当前状态[${getStatusText(contract.status)}]不能签署`
      });
      return;
    }

    const now = new Date();
    const inviteCode = generateInviteCode();
    const inviteExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后过期

    await execute(
      `UPDATE contracts SET
        partyA_sign_status = ?,
        partyA_signed_at = ?,
        partyA_signature = ?,
        invite_code = ?,
        invite_expires_at = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        1,
        now.toISOString(),
        signature,
        inviteCode,
        inviteExpiresAt.toISOString(),
        ContractStatus.PENDING_LESSEE_SIGN,
        now.toISOString(),
        contractId
      ]
    );

    // 不再插入 sign_invitations 表（简化版）

    const updatedContracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    const updatedContract = updatedContracts[0];

    const response: IContractDetailResponse = {
      contract: {
        ...updatedContract
      }
    };

    res.json({
      code: 200,
      message: '签署成功，请分享给乙方签署',
      data: response
    });
  } catch (error) {
    console.error('甲方签署合同错误:', error);
    console.error('contractId:', contractId);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts/:id/share
 * 生成签署链接（甲方分享给乙方）
 * - 验证合同状态为 PENDING_LESSEE_SIGN (2)
 * - 返回 invite_code, share_url, qr_code, expires_at
 */
export const shareContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = req.params.id;

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin && contract.created_by !== userId) {
      res.status(403).json({ code: 403, message: '无权操作此合同' });
      return;
    }

    if (contract.status !== ContractStatus.PENDING_LESSEE_SIGN) {
      res.status(400).json({
        code: 400,
        message: `当前状态[${getStatusText(contract.status)}]不能生成分享链接`
      });
      return;
    }

    if (!contract.invite_code || !contract.invite_expires_at) {
      res.status(400).json({ code: 400, message: '邀请码不存在，请先签署合同' });
      return;
    }

    // 检查邀请码是否过期
    const expiresAt = new Date(contract.invite_expires_at);
    if (expiresAt < new Date()) {
      res.status(400).json({ code: 400, message: '邀请码已过期' });
      return;
    }

    // 生成分享链接和二维码URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/sign/${contract.invite_code}`;
    const qrCodeUrl = `${baseUrl}/api/contracts/invite-qrcode/${contract.invite_code}`;

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        invite_code: contract.invite_code,
        share_url: shareUrl,
        qr_code: qrCodeUrl,
        expires_at: contract.invite_expires_at
      }
    });
  } catch (error) {
    console.error('生成分享链接错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * GET /api/contracts/invite-verify/:code
 * 验证邀请码
 * - 根据 invite_code 查询合同
 * - 返回合同基本信息
 */
export const verifyInviteCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({ code: 400, message: '请提供邀请码' });
      return;
    }

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE invite_code = ?',
      [code]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '邀请码不存在' });
      return;
    }

    const contract = contracts[0];

    let expired = false;
    if (contract.invite_expires_at) {
      const expiresAt = new Date(contract.invite_expires_at);
      if (expiresAt < new Date()) {
        expired = true;
      }
    }

    const isNotPending = contract.status !== ContractStatus.PENDING_LESSEE_SIGN;

    res.json({
      code: 200,
      message: '验证成功',
      data: {
        contract_id: contract.id,
        contract_no: contract.contract_no,
        title: contract.title,
        partyA_company: contract.partyA_company,
        partyA_phone: contract.partyA_phone,
        partyB_name: contract.partyB_name,
        partyB_phone: contract.partyB_phone,
        house_address: contract.house_address,
        lease_start: contract.lease_start,
        lease_end: contract.lease_end,
        monthly_rent: contract.monthly_rent,
        deposit: contract.deposit,
        status: contract.status,
        status_text: getStatusText(contract.status),
        expires_at: contract.invite_expires_at,
        expired: expired,
        invalid: isNotPending
      }
    });
  } catch (error) {
    console.error('验证邀请码错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * POST /api/contracts/:id/tenant-sign
 * 乙方签署合同
 * - 验证 invite_code 有效且未过期
 * - 验证合同状态为 PENDING_LESSEE_SIGN (2)
 * - 接收 signature (Base64图片) 参数
 * - 更新 partyB_sign_status = 1, partyB_signed_at, partyB_signature, sign_date
 * - 状态改为 SIGNED (3)
 * - 设置 effective_at
 */
export const tenantSign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId || !userPhone) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = req.params.id;
    const { signature } = req.body;

    if (!signature) {
      res.status(400).json({ code: 400, message: '请提供签名图片' });
      return;
    }

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    // 验证是否为乙方本人（通过手机号匹配 partyB_phone）
    if (contract.partyB_phone !== userPhone) {
      res.status(403).json({ code: 403, message: '您不是此合同的乙方签署人' });
      return;
    }

    // 验证合同状态
    if (contract.status !== ContractStatus.PENDING_LESSEE_SIGN) {
      res.status(400).json({
        code: 400,
        message: `当前状态[${getStatusText(contract.status)}]不能签署`
      });
      return;
    }

    // 验证邀请码是否过期
    if (contract.invite_expires_at) {
      const expiresAt = new Date(contract.invite_expires_at);
      if (expiresAt < new Date()) {
        res.status(400).json({ code: 400, message: '邀请码已过期' });
        return;
      }
    }

    const now = new Date();

    await execute(
      `UPDATE contracts SET
        partyB_sign_status = ?,
        partyB_signed_at = ?,
        partyB_signature = ?,
        sign_date = ?,
        status = ?,
        effective_at = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        1,
        now.toISOString(),
        signature,
        now.toISOString(),
        ContractStatus.SIGNED,
        now.toISOString(),
        now.toISOString(),
        contractId
      ]
    );

    const updatedContracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    const updatedContract = updatedContracts[0];

    const response: IContractDetailResponse = {
      contract: {
        ...updatedContract
      }
    };

    res.json({
      code: 200,
      message: '签署成功，合同已生效',
      data: response
    });
  } catch (error) {
    console.error('乙方签署合同错误:', error);
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

    const contractId = req.params.id;
    const { reason } = req.body;

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    if (contract.partyB_phone !== userPhone) {
      res.status(403).json({ code: 403, message: '您不是此合同的乙方签署人' });
      return;
    }

    if (contract.status !== ContractStatus.PENDING_LESSEE_SIGN) {
      res.status(400).json({
        code: 400,
        message: `当前状态[${getStatusText(contract.status)}]不能拒绝签署`
      });
      return;
    }

    const now = new Date().toISOString();
    await execute(
      'UPDATE contracts SET status = ?, reject_reason = ?, updated_at = ? WHERE id = ?',
      [ContractStatus.REJECTED, reason || '乙方拒绝签署', now, contractId]
    );

    const updatedContracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    const updatedContract = updatedContracts[0];

    const response: IContractDetailResponse = {
      contract: {
        ...updatedContract
      }
    };

    res.json({
      code: 200,
      message: '已拒绝签署',
      data: response
    });
  } catch (error) {
    console.error('拒绝签署合同错误:', error);
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

    const contractId = req.params.id;

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin && contract.created_by !== userId && contract.partyB_phone !== userPhone) {
      res.status(403).json({ code: 403, message: '无权操作此合同' });
      return;
    }

    if (!canTransitionTo(contract.status, ContractStatus.CANCELLED)) {
      res.status(400).json({
        code: 400,
        message: `当前状态[${getStatusText(contract.status)}]不能取消`
      });
      return;
    }

    const now = new Date().toISOString();
    await execute(
      'UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?',
      [ContractStatus.CANCELLED, now, contractId]
    );

    const updatedContracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    const updatedContract = updatedContracts[0];

    const response: IContractDetailResponse = {
      contract: {
        ...updatedContract
      }
    };

    res.json({
      code: 200,
      message: '合同已取消',
      data: response
    });
  } catch (error) {
    console.error('取消合同错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

/**
 * GET /api/contracts/:id/pdf
 * 生成PDF
 * 从 contracts 表直接获取签名图片和物品清单，不再查询 signatures 和 contract_inventory 表
 */
export const generateContractPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;
    if (!userId || !userPhone) {
      res.status(401).json({ code: 401, message: '用户未认证' });
      return;
    }

    const contractId = req.params.id;

    const contracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (contracts.length === 0) {
      res.status(404).json({ code: 404, message: '合同不存在' });
      return;
    }

    const contract = contracts[0];

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin && contract.created_by !== userId && contract.partyB_phone !== userPhone) {
      res.status(403).json({ code: 403, message: '无权查看此合同' });
      return;
    }

    // 从 contracts 表直接获取签名图片
    const partyASignature = contract.partyA_signature || '';
    const partyBSignature = contract.partyB_signature || '';

    // 从 inventory_items JSON 解析物品清单
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
        startDate: contract.lease_start ? new Date(contract.lease_start).toISOString().split('T')[0] : '',
        endDate: contract.lease_end ? new Date(contract.lease_end).toISOString().split('T')[0] : '',
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
      firstPaymentDate: contract.first_payment_date || '',
      secondPaymentAmount: contract.second_payment_amount || contract.monthly_rent,
      secondPaymentDate: contract.second_payment_date ? new Date(contract.second_payment_date).toISOString().split('T')[0] : '',
      thirdPaymentAmount: contract.third_payment_amount || 0,
      thirdPaymentDate: '',
      electricityMeter: contract.electricity_meter ?? '',
      waterMeter: contract.water_meter ?? '',
      gasMeter: contract.gas_meter ?? '',
      remark: contract.remark || '',
      lessorAccount: contract.partyA_account || '',
      intermediaryName: contract.intermediary_name || '',
      partyACommission: contract.partyA_commission || 0,
      partyBCommission: contract.partyB_commission || 0,
      depositChinese: contract.deposit_chinese || '',
      partyBSignature: partyBSignature,
      items: itemsArray
    };

    const pdfResult: PdfResult = await htmlPdfService.generateContractPdf(contractData);

    if (!pdfResult.success || !pdfResult.filePath) {
      res.status(500).json({ code: 500, message: 'PDF生成失败' });
      return;
    }

    // 更新合同的 PDF 路径（如果已存在则不更新）
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
