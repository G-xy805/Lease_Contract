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

// 合同数据接口
export interface IContract {
  id: number;
  contract_no: string;
  title: string;
  status: ContractStatus;
  created_by: number;
  lessor_user_id: number;

  // 甲方信息
  partyA_company: string | null;    // 甲方公司/姓名
  partyA_phone: string | null;      // 甲方电话
  partyA_contact: string | null;    // 甲方代理人
  partyA_phone2: string | null;     // 甲方备用电话
  partyA_account: string | null;    // 甲方收款账户
  partyA_idcard: string | null;     // 甲方身份证

  // 乙方信息
  partyB_name: string | null;       // 乙方姓名
  partyB_phone: string | null;      // 乙方电话
  partyB_idCard: string | null;     // 乙方身份证
  partyB_contact: string | null;    // 乙方代理人

  // 房屋信息
  house_address: string;
  house_area: number | null;
  rent_purpose: string | null;

  // 租赁期限
  lease_start: Date | null;
  lease_end: Date | null;
  lease_months: number | null;
  advance_notice_days: number | null;

  // 租金和支付
  monthly_rent: number;
  year_rent: number | null;
  payment_method: PaymentMethod;
  payment_cycle: number | null;      // 支付周期（月数）
  payment_count: number | null;      // 支付次数
  first_payment_amount: number | null;
  second_payment_amount: number | null;
  second_payment_date: Date | null;
  third_payment_amount: number | null;
  total_amount: number;

  // 押金
  deposit: number;
  deposit_chinese: string | null;

  // 费用约定
  fee_water: boolean;
  fee_electric: boolean;
  fee_gas: boolean;
  fee_property: boolean;
  fee_heating: boolean;

  // 居间服务
  intermediary_name: string | null;
  partyA_commission: number | null;
  partyA_commission_chinese: string | null;
  partyB_commission: number | null;
  partyB_commission_chinese: string | null;

  // 水电表读数
  electricity_meter: string | null;
  water_meter: string | null;
  gas_meter: string | null;

  // 备注
  remark: string | null;

  // 签署状态
  partyA_sign_status: number;
  partyB_sign_status: number;
  partyA_signed_at: Date | null;
  partyB_signed_at: Date | null;
  partyA_signature: string | null;
  partyB_signature: string | null;
  sign_date: Date | null;

  // 签署邀请
  invite_code: string | null;
  invite_expires_at: Date | null;

  // 合同文档
  contract_pdf_path: string | null;

  // 物品清单（JSON格式）
  inventory_items: InventoryItems;

  // 状态时间
  effective_at: Date | null;
  expires_at: Date | null;
  reject_reason: string | null;

  created_at: Date;
  updated_at: Date;
}

// 合同行数据
export interface ContractRow extends RowDataPacket, IContract {}

// 创建合同数据
export interface IContractCreate {
  title: string;
  lessor_user_id: number;

  // 甲方信息
  partyA_company?: string;
  partyA_phone?: string;
  partyA_contact?: string;
  partyA_phone2?: string;
  partyA_account?: string;
  partyA_idcard?: string;

  // 乙方信息
  partyB_name: string;
  partyB_phone: string;
  partyB_idCard?: string;
  partyB_contact?: string;

  // 房屋信息
  house_address: string;
  house_area?: number;
  rent_purpose?: string;

  // 租赁期限
  lease_start: string;
  lease_end: string;
  lease_months?: number;
  advance_notice_days?: number;

  // 租金和支付
  monthly_rent: number;
  year_rent?: number;
  payment_method: PaymentMethod;
  payment_cycle?: number;
  payment_count?: number;
  first_payment_amount?: number;
  first_payment_date?: string;
  second_payment_amount?: number;
  second_payment_date?: string;
  third_payment_amount?: number;
  deposit?: number;
  deposit_chinese?: string;
  total_amount?: number;

  // 费用约定
  fee_water?: boolean;
  fee_electric?: boolean;
  fee_gas?: boolean;
  fee_property?: boolean;
  fee_heating?: boolean;

  // 居间服务
  intermediary_name?: string;
  partyA_commission?: number;
  partyA_commission_chinese?: string;
  partyB_commission?: number;
  partyB_commission_chinese?: string;

  // 水电表读数
  electricity_meter?: string;
  water_meter?: string;
  gas_meter?: string;

  // 备注
  remark?: string;

  // 物品清单（JSON格式）
  inventory_items?: InventoryItems;
}

// 更新合同数据
export interface IContractUpdate {
  title?: string;
  lessor_user_id?: number;

  // 甲方信息
  partyA_company?: string;
  partyA_phone?: string;
  partyA_contact?: string;
  partyA_phone2?: string;
  partyA_account?: string;
  partyA_idcard?: string;

  // 乙方信息
  partyB_name?: string;
  partyB_phone?: string;
  partyB_idCard?: string;
  partyB_contact?: string;

  // 房屋信息
  house_address?: string;
  house_area?: number;
  rent_purpose?: string;

  // 租赁期限
  lease_start?: string;
  lease_end?: string;
  lease_months?: number;
  advance_notice_days?: number;

  // 租金和支付
  monthly_rent?: number;
  year_rent?: number;
  payment_method?: PaymentMethod;
  payment_cycle?: number;
  payment_count?: number;
  first_payment_amount?: number;
  first_payment_date?: string;
  second_payment_amount?: number;
  second_payment_date?: string;
  third_payment_amount?: number;
  deposit?: number;
  deposit_chinese?: string;
  total_amount?: number;

  // 费用约定
  fee_water?: boolean;
  fee_electric?: boolean;
  fee_gas?: boolean;
  fee_property?: boolean;
  fee_heating?: boolean;

  // 居间服务
  intermediary_name?: string;
  partyA_commission?: number;
  partyA_commission_chinese?: string;
  partyB_commission?: number;
  partyB_commission_chinese?: string;

  // 水电表读数
  electricity_meter?: string;
  water_meter?: string;
  gas_meter?: string;

  // 备注
  remark?: string;

  // 物品清单（JSON格式）
  inventory_items?: InventoryItems;
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
