import { RowDataPacket } from 'mysql2';

// 合同状态枚举
export enum ContractStatus {
  PENDING_LESSOR_SIGN = 1,  // 待甲方签署
  PENDING_LESSEE_SIGN = 2,  // 待乙方签署
  SIGNED = 3,               // 已签署（生效）
  REJECTED = 4,             // 已拒绝
  CANCELLED = 5,            // 已取消
  EXPIRED = 6               // 已到期
}

// 支付方式枚举
export enum PaymentMethod {
  PAY_ONE_MONTH = 1,         // 押一付一
  PAY_THREE_MONTHS = 2,      // 押一付三
  PAY_SIX_MONTHS = 3,        // 押一付六
  PAY_YEARLY = 4             // 年付
}

// 物品清单项接口
export interface IInventoryItem {
  name: string;           // 物品名称
  quantity: number;       // 数量
  templateField?: string;  // 对应的模板字段名
}

// 物品清单JSON格式
export type InventoryItems = IInventoryItem[];

// 费用约定项接口
export interface IFeeItem {
  name: string;      // 费用名称
  checked: boolean;  // 是否勾选（由乙方承担）
}

// 费用约定JSON格式
export type FeeItems = IFeeItem[];

// 合同数据接口（按照 SQLite 表结构的 13 个分组顺序）
export interface IContract {
  // ==================== 1. 基础标识 ====================
  id: number;
  contract_no: string;
  title: string;
  status: ContractStatus;

  // ==================== 2. 用户关联 ====================
  lessor_user_id: number;
  lessee_user_id: number | null;    // 乙方用户ID（可为NULL，乙方注册后补充）
  created_by: number;

  // ==================== 3. 甲乙双方信息 ====================
  partyA_company: string | null;    // 甲方公司/姓名
  partyA_phone: string | null;      // 甲方联系电话
  partyA_contact: string | null;    // 甲方委托代理人
  partyA_phone2: string | null;     // 甲方代理人联系电话
  partyA_account: string | null;    // 甲方账户信息
  partyA_idcard: string | null;     // 甲方身份证号

  partyB_name: string | null;       // 乙方姓名
  partyB_idCard: string | null;     // 乙方身份证号
  partyB_phone: string | null;      // 乙方联系电话
  partyB_contact: string | null;    // 乙方委托代理人

  // ==================== 4. 房屋基本情况 ====================
  house_address: string;            // 房屋地址
  house_area: number | null;        // 建筑面积（平方米）

  // ==================== 5. 租赁期限及用途 - 日期拆分为组件！====================
  lease_start_year: number | null;   // 租赁开始年份
  lease_start_month: number | null;  // 租赁开始月份
  lease_start_day: number | null;    // 租赁开始日期
  lease_end_year: number | null;     // 租赁结束年份
  lease_end_month: number | null;    // 租赁结束月份
  lease_end_day: number | null;      // 租赁结束日期
  lease_months: number | null;       // 租赁总月数
  rent_purpose: string | null;       // 租赁用途
  advance_notice_days: number | null; // 提前通知天数

  // ==================== 6. 租金和支付方式 ====================
  monthly_rent: number;              // 月租金
  year_rent: number | null;          // 年租金/总租金
  payment_method: PaymentMethod;     // 支付方式
  payment_cycle: number | null;      // 支付周期（月数）- INTEGER 类型
  payment_count: number | null;      // 支付次数
  first_payment_amount: number | null;   // 第一次支付金额
  second_payment_amount: number | null;  // 第二次支付金额
  third_payment_amount: number | null;   // 第三次支付金额
  fourth_payment_amount: number | null;  // 第四次支付金额
  partyA_account_for_rent: string | null; // 第三条第3款收款账户

  // ==================== 7. 押金信息 ====================
  deposit: number;                  // 押金金额
  deposit_chinese: string | null;   // 押金大写

  // ==================== 8. 费用约定（JSON格式）====================
  fee_items: FeeItems | null;       // 费用项目JSON（替代原来的7个BOOLEAN字段）

  // ==================== 9. 居间服务 ====================
  intermediary_name: string | null;  // 中介方名称
  partyA_commission: number | null;  // 甲方佣金
  partyA_commission_chinese: string | null; // 甲方佣金大写
  partyB_commission: number | null;  // 乙方佣金
  partyB_commission_chinese: string | null; // 乙方佣金大写

  // ==================== 10. 物品清单及水电表 ====================
  inventory_items: InventoryItems | null; // 物品清单JSON
  electricity_meter: string | null;  // 电表读数
  water_meter: string | null;       // 水表读数
  gas_meter: string | null;         // 燃气表读数

  // ==================== 11. 备注及其他约定 ====================
  remark: string | null;            // 备注及其他约定

  // ==================== 12. 合同文档 ====================
  contract_pdf_path: string | null;  // 合同PDF路径

  // ==================== 13. 状态和时间戳 ====================
  effective_at: Date | null;        // 生效时间
  expires_at: Date | null;          // 过期时间
  reject_reason: string | null;     // 拒绝原因
  sign_date: Date | null;           // 签约日期
  created_at: Date;                 // 创建时间
  updated_at: Date;                 // 更新时间
}

// 合同行数据
export interface ContractRow extends RowDataPacket, IContract {}

// 创建合同数据（使用日期组件 year/month/day）
export interface IContractCreate {
  title: string;
  lessor_user_id: number;
  lessee_user_id?: number | null;  // 乙方用户ID（可选）

  // 甲方信息
  partyA_company?: string;
  partyA_phone?: string;
  partyA_contact?: string;
  partyA_phone2?: string;
  partyA_account?: string;
  partyA_idcard?: string;

  // 乙方信息
  partyB_name: string;
  partyB_idCard?: string;
  partyB_phone?: string;
  partyB_contact?: string;

  // 房屋信息
  house_address: string;
  house_area?: number;

  // 租赁期限及用途（日期拆分为组件！）
  lease_start_year?: number;
  lease_start_month?: number;
  lease_start_day?: number;
  lease_end_year?: number;
  lease_end_month?: number;
  lease_end_day?: number;
  lease_months?: number;
  rent_purpose?: string;
  advance_notice_days?: number;

  // 租金和支付方式
  monthly_rent: number;
  year_rent?: number;
  payment_method: PaymentMethod;
  payment_cycle?: number;           // 支付周期（月数）
  payment_count?: number;           // 支付次数
  first_payment_amount?: number;
  second_payment_amount?: number;
  third_payment_amount?: number;
  fourth_payment_amount?: number;
  partyA_account_for_rent?: string; // 第三条第3款收款账户

  // 押金信息
  deposit?: number;
  deposit_chinese?: string;

  // 费用约定（JSON格式）
  fee_items?: FeeItems;

  // 居间服务
  intermediary_name?: string;
  partyA_commission?: number;
  partyA_commission_chinese?: string;
  partyB_commission?: number;
  partyB_commission_chinese?: string;

  // 物品清单及水电表
  inventory_items?: InventoryItems;
  electricity_meter?: string;
  water_meter?: string;
  gas_meter?: string;

  // 备注
  remark?: string;
}

// 更新合同数据（使用日期组件 year/month/day）
export interface IContractUpdate {
  title?: string;
  lessor_user_id?: number;
  lessee_user_id?: number | null;   // 乙方用户ID

  // 甲方信息
  partyA_company?: string;
  partyA_phone?: string;
  partyA_contact?: string;
  partyA_phone2?: string;
  partyA_account?: string;
  partyA_idcard?: string;

  // 乙方信息
  partyB_name?: string;
  partyB_idCard?: string;
  partyB_phone?: string;
  partyB_contact?: string;

  // 房屋信息
  house_address?: string;
  house_area?: number;

  // 租赁期限及用途（日期拆分为组件！）
  lease_start_year?: number;
  lease_start_month?: number;
  lease_start_day?: number;
  lease_end_year?: number;
  lease_end_month?: number;
  lease_end_day?: number;
  lease_months?: number;
  rent_purpose?: string;
  advance_notice_days?: number;

  // 租金和支付方式
  monthly_rent?: number;
  year_rent?: number;
  payment_method?: PaymentMethod;
  payment_cycle?: number;            // 支付周期（月数）
  payment_count?: number;            // 支付次数
  first_payment_amount?: number;
  second_payment_amount?: number;
  third_payment_amount?: number;
  fourth_payment_amount?: number;
  partyA_account_for_rent?: string;  // 第三条第3款收款账户

  // 押金信息
  deposit?: number;
  deposit_chinese?: string;

  // 费用约定（JSON格式）
  fee_items?: FeeItems;

  // 居间服务
  intermediary_name?: string;
  partyA_commission?: number;
  partyA_commission_chinese?: string;
  partyB_commission?: number;
  partyB_commission_chinese?: string;

  // 物品清单及水电表
  inventory_items?: InventoryItems;
  electricity_meter?: string;
  water_meter?: string;
  gas_meter?: string;

  // 备注
  remark?: string;

  // 合同文档
  contract_pdf_path?: string;

  // 状态和时间戳（通常由系统自动设置，但允许管理员手动调整）
  effective_at?: Date | null;
  expires_at?: Date | null;
  reject_reason?: string | null;
  sign_date?: Date | null;
}

// 合同查询参数
export interface IContractQuery {
  status?: ContractStatus;
  keyword?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

// 合同列表响应
export interface IContractListResponse {
  total: number;
  page: number;
  page_size: number;
  list: IContract[];
}

// 合同详情响应
export interface IContractDetailResponse {
  contract: IContract;
}

// 合同验证响应
export interface IContractVerifyResponse {
  valid: boolean;
  contract?: IContract;
  message: string;
}

// 状态流转映射
export const ContractStatusFlow = {
  [ContractStatus.PENDING_LESSOR_SIGN]: [ContractStatus.PENDING_LESSEE_SIGN, ContractStatus.CANCELLED],
  [ContractStatus.PENDING_LESSEE_SIGN]: [ContractStatus.SIGNED, ContractStatus.REJECTED, ContractStatus.CANCELLED],
  [ContractStatus.SIGNED]: [ContractStatus.EXPIRED, ContractStatus.CANCELLED],
  [ContractStatus.REJECTED]: [],
  [ContractStatus.CANCELLED]: [],
  [ContractStatus.EXPIRED]: []
} as const;

// 检查状态是否可以流转
export const canTransitionTo = (currentStatus: ContractStatus, targetStatus: ContractStatus): boolean => {
  const allowedTransitions = ContractStatusFlow[currentStatus] as unknown as ContractStatus[];
  if (!allowedTransitions) {
    return false;
  }
  return allowedTransitions.includes(targetStatus);
};

// 获取状态文本
export const getStatusText = (status: ContractStatus): string => {
  const statusMap: Record<ContractStatus, string> = {
    [ContractStatus.PENDING_LESSOR_SIGN]: '待甲方签署',
    [ContractStatus.PENDING_LESSEE_SIGN]: '待乙方签署',
    [ContractStatus.SIGNED]: '已签署',
    [ContractStatus.REJECTED]: '已拒绝',
    [ContractStatus.CANCELLED]: '已取消',
    [ContractStatus.EXPIRED]: '已到期'
  };
  return statusMap[status] || '未知状态';
};

// 获取支付方式文本
export const getPaymentMethodText = (method: PaymentMethod): string => {
  const methodMap: Record<PaymentMethod, string> = {
    [PaymentMethod.PAY_ONE_MONTH]: '押一付一',
    [PaymentMethod.PAY_THREE_MONTHS]: '押一付三',
    [PaymentMethod.PAY_SIX_MONTHS]: '押一付六',
    [PaymentMethod.PAY_YEARLY]: '年付'
  };
  return methodMap[method] || '未知方式';
}

// ==================== 日期组件工具函数 ====================

/**
 * 将日期组件（year/month/day）组合为 Date 对象
 * @param year 年份（如 2026）
 * @param month 月份（1-12）
 * @param day 日期（1-31）
 * @returns Date 对象
 */
export function composeDateComponents(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/**
 * 将 Date 对象分解为日期组件（year/month/day）
 * @param date Date 对象
 * @returns 包含 year、month、day 的对象
 */
export function decomposeDate(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}
