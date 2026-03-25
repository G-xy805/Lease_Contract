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

// 物品清单接口
export interface IContractItems {
  item_tv_qty: number;
  item_wardrobe_qty: number;
  item_tv_remote_qty: number;
  item_tv_table_qty: number;
  item_box_qty: number;
  item_sofa_qty: number;
  item_coffee_table_qty: number;
  item_dining_table_qty: number;
  item_chair_qty: number;
  item_bed_qty: number;
  item_nightstand_qty: number;
  item_curtain_qty: number;
  item_ac_qty: number;
  item_ac_remote_qty: number;
  item_fridge_qty: number;
  item_mattress_qty: number;
  item_washer_qty: number;
  item_water_heater_qty: number;
  item_gas_stove_qty: number;
  item_hood_qty: number;
  item_induction_qty: number;
  item_door_card_qty: number;
  item_water_card_qty: number;
  item_power_card_qty: number;
}

// 合同数据接口
export interface IContract {
  id: number;
  contract_no: string;
  title: string;
  // 甲方信息
  lessor_user_id: number;
  lessor_name: string;
  lessor_phone: string;
  lessor_phone2: string | null;
  lessor_idcard: string | null;
  lessor_account: string | null;
  partyA_company: string | null;
  lessor_contact: string | null;
  // 乙方信息
  lessee_name: string;
  lessee_phone: string;
  lessee_idcard: string | null;
  // 房屋信息
  house_address: string;
  house_area: number | null;
  rent_purpose: string | null;
  // 租赁期限
  lease_start: Date;
  lease_end: Date;
  lease_months: number | null;
  advance_notice_days: number | null;
  // 租金和支付
  monthly_rent: number;
  year_rent: number | null;
  payment_method: PaymentMethod;
  payment_cycle: string | null;
  payment_count: number;
  first_payment_amount: number | null;
  first_payment_date: Date | null;
  second_payment_amount: number | null;
  second_payment_date: Date | null;
  third_payment_amount: number | null;
  third_payment_date: Date | null;
  total_amount: number;
  // 押金
  deposit: number;
  deposit_chinese: string | null;
  // 费用约定
  fee_water: boolean;
  fee_electric: boolean;
  fee_gas: boolean;
  fee_tv: boolean;
  fee_network: boolean;
  fee_property: boolean;
  fee_heating: boolean;
  // 居间服务
  partyA_commission: number | null;
  partyA_commission_chinese: string | null;
  partyB_commission: number | null;
  partyB_commission_chinese: string | null;
  // 水电表读数
  electricity_meter: number | null;
  water_meter: number | null;
  gas_meter: number | null;
  // 备注
  remark: string | null;
  // 签署状态
  lessor_sign_status: number;
  lessee_sign_status: number;
  lessor_signed_at: Date | null;
  lessee_signed_at: Date | null;
  lessor_signature: string | null;
  lessee_signature: string | null;
  sign_date: Date | null;
  // 签署邀请
  invite_code: string | null;
  invite_expires_at: Date | null;
  // 合同文档
  contract_pdf_path: string | null;
  // 物品清单
  item_tv_qty: number;
  item_wardrobe_qty: number;
  item_tv_remote_qty: number;
  item_tv_table_qty: number;
  item_box_qty: number;
  item_sofa_qty: number;
  item_coffee_table_qty: number;
  item_dining_table_qty: number;
  item_chair_qty: number;
  item_bed_qty: number;
  item_nightstand_qty: number;
  item_curtain_qty: number;
  item_ac_qty: number;
  item_ac_remote_qty: number;
  item_fridge_qty: number;
  item_mattress_qty: number;
  item_washer_qty: number;
  item_water_heater_qty: number;
  item_gas_stove_qty: number;
  item_hood_qty: number;
  item_induction_qty: number;
  item_door_card_qty: number;
  item_water_card_qty: number;
  item_power_card_qty: number;
  // 状态
  status: ContractStatus;
  effective_at: Date | null;
  expires_at: Date | null;
  reject_reason: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// 合同行数据
export interface ContractRow extends RowDataPacket, IContract {}

// 创建合同数据
export interface IContractCreate {
  title: string;
  lessor_user_id: number;
  lessor_name: string;
  lessor_phone: string;
  lessor_phone2?: string;
  lessor_idcard?: string;
  lessor_account?: string;
  partyA_company?: string;
  lessor_contact?: string;
  lessee_name: string;
  lessee_phone: string;
  lessee_idcard?: string;
  house_address: string;
  house_area?: number;
  rent_purpose?: string;
  lease_start: string;
  lease_end: string;
  lease_months?: number;
  advance_notice_days?: number;
  monthly_rent: number;
  year_rent?: number;
  payment_method: PaymentMethod;
  payment_cycle?: string;
  payment_count?: number;
  first_payment_amount?: number;
  first_payment_date?: string;
  second_payment_amount?: number;
  second_payment_date?: string;
  third_payment_amount?: number;
  third_payment_date?: string;
  deposit?: number;
  deposit_chinese?: string;
  fee_water?: boolean;
  fee_electric?: boolean;
  fee_gas?: boolean;
  fee_tv?: boolean;
  fee_network?: boolean;
  fee_property?: boolean;
  fee_heating?: boolean;
  partyA_commission?: number;
  partyA_commission_chinese?: string;
  partyB_commission?: number;
  partyB_commission_chinese?: string;
  electricity_meter?: number;
  water_meter?: number;
  gas_meter?: number;
  remark?: string;
  // 签署状态
  lessor_sign_status?: number;
  lessee_sign_status?: number;
  lessor_signed_at?: string;
  lessee_signed_at?: string;
  lessor_signature?: string;
  lessee_signature?: string;
  sign_date?: string;
  // 签署邀请
  invite_code?: string;
  invite_expires_at?: string;
  // 合同文档
  contract_pdf_path?: string;
  // 物品清单
  item_tv_qty?: number;
  item_wardrobe_qty?: number;
  item_tv_remote_qty?: number;
  item_tv_table_qty?: number;
  item_box_qty?: number;
  item_sofa_qty?: number;
  item_coffee_table_qty?: number;
  item_dining_table_qty?: number;
  item_chair_qty?: number;
  item_bed_qty?: number;
  item_nightstand_qty?: number;
  item_curtain_qty?: number;
  item_ac_qty?: number;
  item_ac_remote_qty?: number;
  item_fridge_qty?: number;
  item_mattress_qty?: number;
  item_washer_qty?: number;
  item_water_heater_qty?: number;
  item_gas_stove_qty?: number;
  item_hood_qty?: number;
  item_induction_qty?: number;
  item_door_card_qty?: number;
  item_water_card_qty?: number;
  item_power_card_qty?: number;
  items?: Array<{ name: string; quantity: string; unit: string }>;
}

// 更新合同数据
export interface IContractUpdate {
  title?: string;
  lessor_user_id?: number;
  lessor_name?: string;
  lessor_phone?: string;
  lessor_phone2?: string;
  lessor_idcard?: string;
  lessor_account?: string;
  partyA_company?: string;
  lessor_contact?: string;
  lessee_name?: string;
  lessee_phone?: string;
  lessee_idcard?: string;
  house_address?: string;
  house_area?: number;
  rent_purpose?: string;
  lease_start?: string;
  lease_end?: string;
  lease_months?: number;
  advance_notice_days?: number;
  monthly_rent?: number;
  year_rent?: number;
  payment_method?: PaymentMethod;
  payment_cycle?: string;
  payment_count?: number;
  first_payment_amount?: number;
  first_payment_date?: string;
  second_payment_amount?: number;
  second_payment_date?: string;
  third_payment_amount?: number;
  third_payment_date?: string;
  deposit?: number;
  deposit_chinese?: string;
  fee_water?: boolean;
  fee_electric?: boolean;
  fee_gas?: boolean;
  fee_tv?: boolean;
  fee_network?: boolean;
  fee_property?: boolean;
  fee_heating?: boolean;
  partyA_commission?: number;
  partyA_commission_chinese?: string;
  partyB_commission?: number;
  partyB_commission_chinese?: string;
  electricity_meter?: number;
  water_meter?: number;
  gas_meter?: number;
  remark?: string;
  // 签署状态
  lessor_sign_status?: number;
  lessee_sign_status?: number;
  lessor_signed_at?: string;
  lessee_signed_at?: string;
  lessor_signature?: string;
  lessee_signature?: string;
  sign_date?: string;
  // 签署邀请
  invite_code?: string;
  invite_expires_at?: string;
  // 合同文档
  contract_pdf_path?: string;
  // 物品清单
  item_tv_qty?: number;
  item_wardrobe_qty?: number;
  item_tv_remote_qty?: number;
  item_tv_table_qty?: number;
  item_box_qty?: number;
  item_sofa_qty?: number;
  item_coffee_table_qty?: number;
  item_dining_table_qty?: number;
  item_chair_qty?: number;
  item_bed_qty?: number;
  item_nightstand_qty?: number;
  item_curtain_qty?: number;
  item_ac_qty?: number;
  item_ac_remote_qty?: number;
  item_fridge_qty?: number;
  item_mattress_qty?: number;
  item_washer_qty?: number;
  item_water_heater_qty?: number;
  item_gas_stove_qty?: number;
  item_hood_qty?: number;
  item_induction_qty?: number;
  item_door_card_qty?: number;
  item_water_card_qty?: number;
  item_power_card_qty?: number;
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
  const allowedTransitions = ContractStatusFlow[currentStatus];
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
