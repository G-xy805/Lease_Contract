/**
 * 合同业务逻辑层（Service）
 * 
 * 核心职责：
 * 1. 合同的创建、查询、更新、删除等核心业务逻辑
 * 2. 用户信息自动关联和快照
 * 3. 签署状态管理和聚合
 * 4. 日期组件处理和验证
 */

import { query, insert, execute } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  ContractStatus,
  PaymentMethod,
  IContract,
  IContractCreate,
  IContractUpdate,
  IContractListResponse,
  IContractDetailResponse,
  ContractRow,
  canTransitionTo,
  getStatusText,
  getPaymentMethodText,
  composeDateComponents
} from '../models/Contract';
import { SignRole, SignStatus, ISignature, SignatureRow } from '../models/Signature';
import { validateIdCard, validatePhone, validateAmount } from '../utils/validation';

// ==================== 工具函数 ====================

/**
 * 生成合同编号
 * 格式：LC{年月日}{6位随机字符}
 */
export const generateContractNo = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LC${year}${month}${day}${random}`;
};

/**
 * 计算年租金
 * 公式：year_rent = monthly_rent * lease_months
 */
const calculateYearRent = (monthlyRent: number, leaseMonths: number): number => {
  return monthlyRent * leaseMonths;
};

/**
 * 验证日期组件是否有效
 * @param year 年份
 * @param month 月份 (1-12)
 * @param day 日期 (1-31)
 */
const validateDateComponents = (year: number | null | undefined, month: number | null | undefined, day: number | null | undefined): boolean => {
  if (!year || !month || !day) return false;
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // 验证日期是否真实存在（如2月30日无效）
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
};

/**
 * 从 users 表获取用户信息并快照到 partyA_* 字段
 * @param userId 用户ID
 * @returns 甲方信息对象或 null
 */
const getLessorSnapshotFromUsers = async (userId: number): Promise<{
  company: string | null;
  phone: string | null;
  idcard: string | null;
} | null> => {
  try {
    const users = await query<RowDataPacket[]>(
      'SELECT name, phone, idcard FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length > 0) {
      const user = users[0];
      return {
        company: user.name || null,
        phone: user.phone || null,
        idcard: user.idcard || null
      };
    }
    return null;
  } catch (error) {
    console.error('从 users 表获取甲方信息失败:', error);
    return null;
  }
};

/**
 * 根据 partyB_phone 查询 users 表获取 lessee_user_id
 * @param phone 乙方手机号
 * @returns 用户ID 或 null
 */
const findLesseeUserByPhone = async (phone: string): Promise<number | null> => {
  try {
    const users = await query<RowDataPacket[]>(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );
    
    if (users.length > 0) {
      return users[0].id as number;
    }
    return null;
  } catch (error) {
    console.error('根据手机号查询乙方用户失败:', error);
    return null;
  }
};

// ==================== 核心业务方法 ====================

/**
 * 创建合同
 * 
 * 新特性：
 * - 接收日期组件参数（lease_start_year/month/day, lease_end_year/month/day）
 * - 自动尝试根据 partyB_phone 查询 users 表获取 lessee_user_id
 * - 从 users 表快照甲方信息到 partyA_* 字段
 * - 计算 year_rent = monthly_rent * lease_months
 * - 不再设置 invite_code/invite_expires_at（这些移到了 sign_invitations 表）
 */
export const createContractService = async (
  userId: number,
  data: IContractCreate
): Promise<IContract> => {
  // 1. 验证必填字段
  const {
    title,
    partyB_name,
    partyB_phone,
    house_address,
    lease_start_year,
    lease_start_month,
    lease_start_day,
    lease_end_year,
    lease_end_month,
    lease_end_day,
    monthly_rent
  } = data;

  if (!title || !partyB_name || !partyB_phone || !house_address ||
      !lease_start_year || !lease_start_month || !lease_start_day ||
      !lease_end_year || !lease_end_month || !lease_end_day || !monthly_rent) {
    throw new Error('缺少必填参数：title、partyB_name、partyB_phone、house_address、租赁日期组件、monthly_rent');
  }

  // 2. 验证日期组件有效性
  if (!validateDateComponents(lease_start_year, lease_start_month, lease_start_day)) {
    throw new Error('租赁开始日期组件无效');
  }

  if (!validateDateComponents(lease_end_year, lease_end_month, lease_end_day)) {
    throw new Error('租赁结束日期组件无效');
  }

  // 3. 验证结束日期晚于开始日期
  const startDate = composeDateComponents(lease_start_year, lease_start_month, lease_start_day);
  const endDate = composeDateComponents(lease_end_year, lease_end_month, lease_end_day);
  
  if (endDate <= startDate) {
    throw new Error('租赁结束日期必须晚于开始日期');
  }

  // 4. 验证手机号格式
  if (!validatePhone(partyB_phone)) {
    throw new Error('乙方手机号格式不正确');
  }

  if (data.partyA_phone && !validatePhone(data.partyA_phone)) {
    throw new Error('甲方手机号格式不正确');
  }

  // 5. 验证身份证号格式
  if (data.partyA_idcard && !validateIdCard(data.partyA_idcard)) {
    throw new Error('甲方身份证号格式不正确');
  }

  if (data.partyB_idCard && !validateIdCard(data.partyB_idCard)) {
    throw new Error('乙方身份证号格式不正确');
  }

  // 6. 验证金额
  if (!validateAmount(monthly_rent)) {
    throw new Error('月租金金额格式不正确');
  }

  // 7. 自动关联用户信息
  let lesseeUserId: number | null = null;

  // 如果前端传了 lessee_user_id，直接使用；否则尝试通过手机号查找
  if (data.lessee_user_id) {
    lesseeUserId = data.lessee_user_id;
  } else {
    lesseeUserId = await findLesseeUserByPhone(partyB_phone);
  }

  // 8. 从 users 表快照甲方信息
  const lessorSnapshot = await getLessorSnapshotFromUsers(userId);

  // 9. 计算租期月数（使用传入值或自动计算）
  const months = data.lease_months && data.lease_months > 0 
    ? data.lease_months 
    : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

  // 10. 计算 year_rent
  const calculatedYearRent = calculateYearRent(monthly_rent, months);

  // 11. 处理 JSON 字段
  const feeItemsJson = data.fee_items && Array.isArray(data.fee_items) 
    ? JSON.stringify(data.fee_items) 
    : null;

  const inventoryItemsJson = data.inventory_items && Array.isArray(data.inventory_items) 
    ? JSON.stringify(data.inventory_items) 
    : null;

  // 12. 生成合同编号和时间戳
  const contract_no = generateContractNo();
  const now = new Date().toISOString();

  // 13. 构建插入数据（使用新的字段名）
  const insertColumns = [
    'contract_no', 'title', 'status',
    'lessor_user_id', 'lessee_user_id', 'created_by',
    // 甲方信息（优先使用传入值，否则使用用户表快照）
    'partyA_company', 'partyA_phone', 'partyA_contact', 'partyA_phone2', 'partyA_account', 'partyA_idcard',
    // 乙方信息
    'partyB_name', 'partyB_idCard', 'partyB_phone', 'partyB_contact',
    // 房屋信息
    'house_address', 'house_area',
    // 租赁期限（日期组件！）
    'lease_start_year', 'lease_start_month', 'lease_start_day',
    'lease_end_year', 'lease_end_month', 'lease_end_day',
    'lease_months', 'rent_purpose', 'advance_notice_days',
    // 租金和支付方式
    'monthly_rent', 'year_rent',
    'payment_method', 'payment_cycle', 'payment_count',
    'first_payment_amount', 'second_payment_amount', 'third_payment_amount', 'fourth_payment_amount',
    'partyA_account_for_rent',
    // 押金信息
    'deposit', 'deposit_chinese',
    // 费用约定（JSON）
    'fee_items',
    // 居间服务
    'intermediary_name', 'partyA_commission', 'partyA_commission_chinese', 'partyB_commission', 'partyB_commission_chinese',
    // 物品清单及水电表
    'inventory_items', 'electricity_meter', 'water_meter', 'gas_meter',
    // 备注
    'remark',
    // 时间戳
    'created_at', 'updated_at'
  ];

  const insertValues = [
    contract_no, title, ContractStatus.PENDING_LESSOR_SIGN,
    userId, lesseeUserId, userId,
    // 甲方信息（优先级：传入值 > 用户表快照 > null）
    data.partyA_company || lessorSnapshot?.company || null,
    data.partyA_phone || lessorSnapshot?.phone || null,
    data.partyA_contact || null,
    data.partyA_phone2 || null,
    data.partyA_account || null,
    data.partyA_idcard || lessorSnapshot?.idcard || null,
    // 乙方信息
    partyB_name,
    data.partyB_idCard || null,
    partyB_phone,
    data.partyB_contact || null,
    // 房屋信息
    house_address,
    data.house_area || null,
    // 租赁期限（日期组件！）
    lease_start_year, lease_start_month, lease_start_day,
    lease_end_year, lease_end_month, lease_end_day,
    months,
    data.rent_purpose || null,
    data.advance_notice_days || null,
    // 租金和支付方式
    monthly_rent,
    calculatedYearRent,
    data.payment_method || PaymentMethod.PAY_ONE_MONTH,
    data.payment_cycle || null,
    data.payment_count || 1,
    data.first_payment_amount || null,
    data.second_payment_amount || null,
    data.third_payment_amount || null,
    data.fourth_payment_amount || null,
    data.partyA_account_for_rent || null,
    // 押金信息
    data.deposit || monthly_rent,  // 默认押金=月租金
    data.deposit_chinese || null,
    // 费用约定（JSON）
    feeItemsJson,
    // 居间服务
    data.intermediary_name || null,
    data.partyA_commission || null,
    data.partyA_commission_chinese || null,
    data.partyB_commission || null,
    data.partyB_commission_chinese || null,
    // 物品清单及水电表
    inventoryItemsJson,
    data.electricity_meter || null,
    data.water_meter || null,
    data.gas_meter || null,
    // 备注
    data.remark || null,
    // 时间戳
    now, now
  ];

  const placeholders = insertColumns.map(() => '?').join(', ');

  // 14. 执行插入操作
  await insert(
    `INSERT INTO contracts (${insertColumns.join(', ')}) VALUES (${placeholders})`,
    insertValues
  );

  // 15. 查询并返回新创建的合同
  const newContracts = await query<ContractRow[]>(
    'SELECT * FROM contracts WHERE contract_no = ?',
    [contract_no]
  );

  if (newContracts.length === 0) {
    throw new Error('合同创建失败，无法查询到新记录');
  }

  return newContracts[0] as IContract;
};

/**
 * 获取合同详情（包含签名信息）
 * 
 * 新特性：
 * - LEFT JOIN signatures 表获取完整签署信息
 * - 聚合返回甲方/乙方签名状态
 * - 使用新的字段名（不含旧的 sign_status/signature 字段）
 */
export const getContractByIdService = async (
  contractId: number,
  userId?: number,
  userPhone?: string
): Promise<{
  contract: IContract;
  signatures: ISignature[];
  signStatus: {
    partyA: { signed: boolean; signedAt: Date | null; signature: string | null };
    partyB: { signed: boolean; signedAt: Date | null; signature: string | null };
    currentStep: string;
  };
}> => {
  // 1. 查询合同基本信息
  const contracts = await query<ContractRow[]>(
    'SELECT * FROM contracts WHERE id = ?',
    [contractId]
  );

  if (contracts.length === 0) {
    throw new Error('合同不存在');
  }

  const contract = contracts[0] as IContract;

  // 2. 权限验证（如果提供了用户信息）
  if (userId && userPhone) {
    const isAdmin = await isAdminUserService(userId);
    if (!isAdmin && contract.created_by !== userId && contract.partyB_phone !== userPhone) {
      throw new Error('无权查看此合同');
    }
  }

  // 3. LEFT JOIN signatures 表查询签署记录
  const signatures = await query<SignatureRow[]>(
    `SELECT * FROM signatures WHERE contract_id = ? ORDER BY created_at ASC`,
    [contractId]
  );

  // 4. 聚合签署状态
  const signStatus = aggregateSignStatus(signatures, contract.status);

  return {
    contract,
    signatures: signatures as ISignature[],
    signStatus
  };
};

/**
 * 更新合同
 * 
 * 新特性：
 * - 支持所有新字段更新
 * - 日期组件自动组合验证
 * - 只允许在 PENDING_LESSOR_SIGN 状态下更新
 */
export const updateContractService = async (
  contractId: number,
  userId: number,
  updateData: IContractUpdate
): Promise<IContract> => {
  // 1. 查询现有合同
  const contracts = await query<ContractRow[]>(
    'SELECT * FROM contracts WHERE id = ?',
    [contractId]
  );

  if (contracts.length === 0) {
    throw new Error('合同不存在');
  }

  const contract = contracts[0];

  // 2. 权限验证
  const isAdmin = await isAdminUserService(userId);
  if (!isAdmin && contract.created_by !== userId) {
    throw new Error('无权修改此合同');
  }

  // 3. 状态验证（只有待签署状态可以修改）
  if (contract.status !== ContractStatus.PENDING_LESSOR_SIGN) {
    throw new Error(`当前状态[${getStatusText(contract.status)}]不能修改`);
  }

  // 4. 如果有日期组件更新，验证日期有效性
  if (updateData.lease_start_year || updateData.lease_start_month || updateData.lease_start_day) {
    const year = updateData.lease_start_year ?? contract.lease_start_year;
    const month = updateData.lease_start_month ?? contract.lease_start_month;
    const day = updateData.lease_start_day ?? contract.lease_start_day;
    
    if (year && month && day && !validateDateComponents(year, month, day)) {
      throw new Error('租赁开始日期组件无效');
    }
  }

  if (updateData.lease_end_year || updateData.lease_end_month || updateData.lease_end_day) {
    const year = updateData.lease_end_year ?? contract.lease_end_year;
    const month = updateData.lease_end_month ?? contract.lease_end_month;
    const day = updateData.lease_end_day ?? contract.lease_end_day;
    
    if (year && month && day && !validateDateComponents(year, month, day)) {
      throw new Error('租赁结束日期组件无效');
    }
  }

  // 5. 构建更新字段列表（使用新的字段名）
  const updates: string[] = [];
  const values: any[] = [];

  const allowedFields: (keyof IContractUpdate)[] = [
    'title',
    // 甲方信息
    'partyA_company', 'partyA_contact', 'partyA_phone', 'partyA_phone2', 'partyA_idcard', 'partyA_account',
    // 乙方信息
    'partyB_name', 'partyB_phone', 'partyB_idCard', 'partyB_contact',
    // 房屋信息
    'house_address', 'house_area',
    // 租赁期限（日期组件！）
    'lease_start_year', 'lease_start_month', 'lease_start_day',
    'lease_end_year', 'lease_end_month', 'lease_end_day',
    'lease_months', 'rent_purpose', 'advance_notice_days',
    // 租金和支付方式
    'monthly_rent', 'year_rent',
    'payment_method', 'payment_cycle', 'payment_count',
    'first_payment_amount', 'second_payment_amount', 'third_payment_amount', 'fourth_payment_amount',
    'partyA_account_for_rent',
    // 押金信息
    'deposit', 'deposit_chinese',
    // 费用约定（JSON）
    'fee_items',
    // 居间服务
    'intermediary_name', 'partyA_commission', 'partyA_commission_chinese', 'partyB_commission', 'partyB_commission_chinese',
    // 物品清单及水电表
    'inventory_items', 'electricity_meter', 'water_meter', 'gas_meter',
    // 备注
    'remark'
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updates.push(`${field} = ?`);
      
      // JSON 字段特殊处理
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
    throw new Error('没有需要更新的字段');
  }

  // 6. 添加 updated_at 时间戳
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(contractId);

  // 7. 执行更新
  await execute(
    `UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // 8. 查询并返回更新后的合同
  const updatedContracts = await query<ContractRow[]>(
    'SELECT * FROM contracts WHERE id = ?',
    [contractId]
  );

  return updatedContracts[0] as IContract;
};

/**
 * 删除合同
 * 只有未生效的合同可以删除
 */
export const deleteContractService = async (
  contractId: number,
  userId: number
): Promise<void> => {
  const contracts = await query<ContractRow[]>(
    'SELECT * FROM contracts WHERE id = ?',
    [contractId]
  );

  if (contracts.length === 0) {
    throw new Error('合同不存在');
  }

  const contract = contracts[0];

  // 权限验证
  const isAdmin = await isAdminUserService(userId);
  if (!isAdmin && contract.created_by !== userId) {
    throw new Error('无权删除此合同');
  }

  // 状态验证
  if (contract.status !== ContractStatus.PENDING_LESSOR_SIGN && 
      contract.status !== ContractStatus.PENDING_LESSEE_SIGN &&
      contract.status !== ContractStatus.REJECTED &&
      contract.status !== ContractStatus.CANCELLED) {
    throw new Error('只有未生效的合同可以删除');
  }

  await execute('DELETE FROM contracts WHERE id = ?', [contractId]);
};

/**
 * 获取合同签署状态（辅助方法）
 * 
 * 从 signatures 表查询甲方和乙方的签署状态
 * 返回聚合结果
 */
export const getContractSignStatus = async (
  contractId: number
): Promise<{
  partyA: { signed: boolean; signedAt: Date | null; signature: string | null };
  partyB: { signed: boolean; signedAt: Date | null; signature: string | null };
  currentStep: string;
}> => {
  // 1. 查询合同基本信息（用于获取 status）
  const contracts = await query<ContractRow[]>(
    'SELECT status FROM contracts WHERE id = ?',
    [contractId]
  );

  if (contracts.length === 0) {
    throw new Error('合同不存在');
  }

  const contractStatus = contracts[0].status;

  // 2. 查询所有签名记录
  const signatures = await query<SignatureRow[]>(
    `SELECT * FROM signatures WHERE contract_id = ?`,
    [contractId]
  );

  // 3. 聚合签署状态
  return aggregateSignStatus(signatures, contractStatus);
};

/**
 * 内部方法：聚合签名记录为签署状态
 */
const aggregateSignStatus = (
  signatures: SignatureRow[],
  contractStatus: ContractStatus
): {
  partyA: { signed: boolean; signedAt: Date | null; signature: string | null };
  partyB: { signed: boolean; signedAt: Date | null; signature: string | null };
  currentStep: string;
} => {
  // 初始化默认状态
  const result = {
    partyA: { signed: false, signedAt: null as Date | null, signature: null as string | null },
    partyB: { signed: false, signedAt: null as Date | null, signature: null as string | null },
    currentStep: 'unknown' as string
  };

  // 遍历签名记录，提取甲乙双方状态
  for (const sig of signatures) {
    if (sig.sign_role === SignRole.LESSOR && sig.sign_status === SignStatus.CONFIRMED) {
      result.partyA.signed = true;
      result.partyA.signedAt = sig.signed_at;
      result.partyA.signature = sig.signature_data;
    } else if (sig.sign_role === SignRole.LESSEE && sig.sign_status === SignStatus.CONFIRMED) {
      result.partyB.signed = true;
      result.partyB.signedAt = sig.signed_at;
      result.partyB.signature = sig.signature_data;
    }
  }

  // 根据合同状态和签名情况确定当前步骤
  if (contractStatus === ContractStatus.SIGNED) {
    result.currentStep = 'signed';
  } else if (result.partyA.signed && !result.partyB.signed) {
    result.currentStep = 'pending_lessee';
  } else if (!result.partyA.signed) {
    result.currentStep = 'pending_lessor';
  } else {
    result.currentStep = 'other';
  }

  return result;
};

/**
 * 获取合同列表（支持筛选和分页）
 * 
 * 新特性：
 * - 支持按 lessee_user_id 筛选
 * - 可选：通过子查询添加签署状态摘要
 */
export const getContractListService = async (
  params: {
    userId?: number;
    userPhone?: string;
    role?: 'landlord' | 'tenant';  // 角色类型
    status?: string;
    keyword?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
    lessee_user_id?: number;  // 新增：按乙方用户ID筛选
  }
): Promise<IContractListResponse> => {
  const {
    userId,
    userPhone,
    role = 'landlord',
    status,
    keyword,
    start_date,
    end_date,
    page = 1,
    page_size = 10,
    lessee_user_id
  } = params;

  const pageNum = parseInt(page as any as string, 10) || 1;
  const pageSize = parseInt(page_size as any as string, 10) || 10;
  const offset = (pageNum - 1) * pageSize;

  // 构建 WHERE 条件
  let whereClause = '';
  const queryParams: any[] = [];

  // 根据角色确定基础查询条件
  if (role === 'landlord' && userId) {
    whereClause = 'WHERE created_by = ?';
    queryParams.push(userId);
  } else if (role === 'tenant' && userPhone) {
    whereClause = 'WHERE (partyB_phone = ? OR lessee_user_id = ?)';
    queryParams.push(userPhone, userId);
  }

  // 状态筛选
  if (status) {
    const statusStr = status as string;
    if (statusStr.includes(',')) {
      const statusList = statusStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      if (statusList.length > 0) {
        whereClause += ` AND status IN (${statusList.map(() => '?').join(',')})`;
        queryParams.push(...statusList);
      }
    } else {
      whereClause += ' AND status = ?';
      queryParams.push(parseInt(statusStr, 10));
    }
  }

  // 关键词搜索
  if (keyword) {
    whereClause += ' AND (title LIKE ? OR contract_no LIKE ? OR partyB_name LIKE ? OR house_address LIKE ?)';
    const searchKeyword = `%${keyword}%`;
    queryParams.push(searchKeyword, searchKeyword, searchKeyword, searchKeyword);
  }

  // 按乙方用户ID筛选（新增功能）
  if (lessee_user_id) {
    whereClause += ' AND lessee_user_id = ?';
    queryParams.push(lessee_user_id);
  }

  // 注意：日期筛选已移除旧的 lease_start/lease_end 字段引用
  // 如需日期筛选，需要使用日期组件进行组合查询（此处暂不实现）

  // 查询总数
  const countResult = await query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM contracts ${whereClause}`,
    queryParams
  );
  const total = countResult[0].total as number;

  // 查询列表数据
  const listResult = await query<ContractRow[]>(
    `SELECT * FROM contracts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...queryParams, pageSize, offset]
  );

  // 可选：为每条记录添加签署状态摘要（性能考虑，此处不默认启用）
  const list = listResult.map(contract => ({
    ...contract
  })) as IContract[];

  return {
    total,
    page: pageNum,
    page_size: pageSize,
    list
  };
};

/**
 * 甲方签署合同
 * 
 * 新特性：
 * - 写入 signatures 表（而非 contracts 表的 signature 字段）
 * - 使用新的 sign_role 和 sign_status 字段
 * - 更新合同状态（PENDING_LESSOR_SIGN -> PENDING_LESSEE_SIGN）
 * - 不再设置 invite_code/invite_expires_at（由 sign_invitations 表管理）
 */
export const lessorSignService = async (
  contractId: number,
  userId: number,
  signatureData: string,
  ipAddress?: string | null,
  deviceInfo?: string | null
): Promise<{
  contract: IContract;
  signature: ISignature;
}> => {
  // 1. 查询合同
  const contracts = await query<ContractRow[]>(
    'SELECT * FROM contracts WHERE id = ?',
    [contractId]
  );

  if (contracts.length === 0) {
    throw new Error('合同不存在');
  }

  const contract = contracts[0];

  // 2. 权限验证
  const isAdmin = await isAdminUserService(userId);
  if (!isAdmin && contract.created_by !== userId) {
    throw new Error('无权操作此合同');
  }

  // 3. 状态验证
  if (contract.status !== ContractStatus.PENDING_LESSOR_SIGN) {
    throw new Error(`当前状态[${getStatusText(contract.status)}]不能签署`);
  }

  // 4. 获取甲方姓名（优先使用 partyA_company）
  const signerName = contract.partyA_company || '甲方';
  const signerPhone = contract.partyA_phone || null;

  const now = new Date();

  try {
    // 5. 在事务中执行：插入签名记录 + 更新合同状态
    // 注意：此处简化处理，实际生产环境应使用数据库事务
    
    // 5.1 插入签名记录到 signatures 表
    const signatureInsertResult = await insert(
      `INSERT INTO signatures (
        contract_id, user_id, sign_role, sign_name, sign_phone, 
        signature_data, sign_status, ip_address, device_info, signed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contractId,
        userId,
        SignRole.LESSOR,
        signerName,
        signerPhone,
        signatureData,
        SignStatus.CONFIRMED,
        ipAddress || null,
        deviceInfo || null,
        now.toISOString(),
        now.toISOString()
      ]
    );

    // 5.2 更新合同状态为待乙方签署
    await execute(
      `UPDATE contracts SET 
        status = ?, 
        updated_at = ?
      WHERE id = ?`,
      [
        ContractStatus.PENDING_LESSEE_SIGN,
        now.toISOString(),
        contractId
      ]
    );

    // 6. 查询更新后的合同和签名记录
    const updatedContracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    const newSignature = await query<SignatureRow[]>(
      'SELECT * FROM signatures WHERE id = ?',
      [(signatureInsertResult as ResultSetHeader).insertId]
    );

    return {
      contract: updatedContracts[0] as IContract,
      signature: newSignature[0] as ISignature
    };
  } catch (error) {
    console.error('甲方签署失败:', error);
    throw new Error('甲方签署失败，请重试');
  }
};

/**
 * 乙方签署合同
 * 
 * 新特性：
 * - 写入 signatures 表（而非 contracts 表的 signature 字段）
 * - 使用新的 sign_role 和 sign_status 字段
 * - 更新合同状态（PENDING_LESSEE_SIGN -> SIGNED）
 * - 设置 effective_at（当双方都签完后）
 */
export const tenantSignService = async (
  contractId: number,
  userId: number,
  userPhone: string,
  signatureData: string,
  ipAddress?: string | null,
  deviceInfo?: string | null
): Promise<{
  contract: IContract;
  signature: ISignature;
}> => {
  // 1. 查询合同
  const contracts = await query<ContractRow[]>(
    'SELECT * FROM contracts WHERE id = ?',
    [contractId]
  );

  if (contracts.length === 0) {
    throw new Error('合同不存在');
  }

  const contract = contracts[0];

  // 2. 验证是否为乙方本人
  if (contract.partyB_phone !== userPhone) {
    throw new Error('您不是此合同的乙方签署人');
  }

  // 3. 状态验证
  if (contract.status !== ContractStatus.PENDING_LESSEE_SIGN) {
    throw new Error(`当前状态[${getStatusText(contract.status)}]不能签署`);
  }

  // 4. 获取乙方姓名
  const signerName = contract.partyB_name || '乙方';

  const now = new Date();

  try {
    // 5. 在事务中执行：插入签名记录 + 更新合同状态
    
    // 5.1 插入签名记录到 signatures 表
    const signatureInsertResult = await insert(
      `INSERT INTO signatures (
        contract_id, user_id, sign_role, sign_name, sign_phone, 
        signature_data, sign_status, ip_address, device_info, signed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contractId,
        userId,
        SignRole.LESSEE,
        signerName,
        userPhone,
        signatureData,
        SignStatus.CONFIRMED,
        ipAddress || null,
        deviceInfo || null,
        now.toISOString(),
        now.toISOString()
      ]
    );

    // 5.2 更新合同状态为已签署，并设置生效时间
    await execute(
      `UPDATE contracts SET 
        status = ?, 
        effective_at = ?,
        sign_date = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        ContractStatus.SIGNED,
        now.toISOString(),
        now.toISOString(),
        now.toISOString(),
        contractId
      ]
    );

    // 6. 查询更新后的合同和签名记录
    const updatedContracts = await query<ContractRow[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    const newSignature = await query<SignatureRow[]>(
      'SELECT * FROM signatures WHERE id = ?',
      [(signatureInsertResult as ResultSetHeader).insertId]
    );

    return {
      contract: updatedContracts[0] as IContract,
      signature: newSignature[0] as ISignature
    };
  } catch (error) {
    console.error('乙方签署失败:', error);
    throw new Error('乙方签署失败，请重试');
  }
};

/**
 * 拒绝签署（乙方）
 */
export const rejectContractService = async (
  contractId: number,
  userId: number,
  userPhone: string,
  reason?: string
): Promise<IContract> => {
  const contracts = await query<ContractRow[]>(
    'SELECT * FROM contracts WHERE id = ?',
    [contractId]
  );

  if (contracts.length === 0) {
    throw new Error('合同不存在');
  }

  const contract = contracts[0];

  if (contract.partyB_phone !== userPhone) {
    throw new Error('您不是此合同的乙方签署人');
  }

  if (contract.status !== ContractStatus.PENDING_LESSEE_SIGN) {
    throw new Error(`当前状态[${getStatusText(contract.status)}]不能拒绝签署`);
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

  return updatedContracts[0] as IContract;
};

/**
 * 取消合同
 */
export const cancelContractService = async (
  contractId: number,
  userId: number,
  userPhone?: string
): Promise<IContract> => {
  const contracts = await query<ContractRow[]>(
    'SELECT * FROM contracts WHERE id = ?',
    [contractId]
  );

  if (contracts.length === 0) {
    throw new Error('合同不存在');
  }

  const contract = contracts[0];

  const isAdmin = await isAdminUserService(userId);
  if (!isAdmin && contract.created_by !== userId && contract.partyB_phone !== userPhone) {
    throw new Error('无权操作此合同');
  }

  if (!canTransitionTo(contract.status, ContractStatus.CANCELLED)) {
    throw new Error(`当前状态[${getStatusText(contract.status)}]不能取消`);
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

  return updatedContracts[0] as IContract;
};

// ==================== 权限验证辅助方法 ====================

/**
 * 检查用户是否为管理员
 */
const isAdminUserService = async (userId: number): Promise<boolean> => {
  try {
    const users = await query<RowDataPacket[]>('SELECT role FROM users WHERE id = ?', [userId]);
    // 假设 UserRole.ADMIN 的值为 'admin'
    return users.length > 0 && users[0].role === 'admin';
  } catch (error) {
    console.error('检查管理员权限失败:', error);
    return false;
  }
};
