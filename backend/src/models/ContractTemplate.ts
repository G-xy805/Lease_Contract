/**
 * 合同模板数据模型
 */

import { RowDataPacket } from 'mysql2/promise';

export interface ContractTemplate {
  id: number;                    // 模板ID
  name: string;                  // 模板名称
  code: string;                   // 模板编码
  description?: string;          // 模板描述
  html_content: string;          // HTML模板内容
  field_mapping: object;         // 字段映射配置
  status: number;                // 状态：0-禁用 1-启用
  created_at: Date;              // 创建时间
  updated_at: Date;              // 更新时间
  created_by?: number;           // 创建人ID
  category?: string;             // 模板分类
  version?: string;              // 版本号
}

export interface ContractTemplateRow extends ContractTemplate, RowDataPacket {}

export interface ContractTemplateListQuery {
  status?: number;               // 状态筛选
  category?: string;             // 分类筛选
  keyword?: string;              // 关键词搜索
  page?: number;                 // 页码
  pageSize?: number;             // 每页数量
}

export interface ContractTemplateListResult {
  list: ContractTemplate[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateContractTemplateDto {
  name: string;
  code: string;
  description?: string;
  html_content: string;
  field_mapping?: object;
  status?: number;
  category?: string;
  version?: string;
}

export interface UpdateContractTemplateDto {
  name?: string;
  description?: string;
  html_content?: string;
  field_mapping?: object;
  status?: number;
  category?: string;
  version?: string;
}

// 默认字段映射（用于初始化模板）
export const defaultFieldMapping = {
  party_b_name: '乙方姓名',
  party_b_idcard: '乙方身份证号',
  party_b_phone: '乙方联系电话',
  party_b_agent: '乙方委托代理人',
  property_location: '房产位置',
  property_area: '建筑面积',
  lease_start: '租赁开始日期',
  lease_end: '租赁结束日期',
  lease_months: '租赁月数',
  lease_purpose: '租赁用途',
  monthly_rent: '月租金',
  annual_rent: '年租金',
  rent_payment_type: '租金支付方式',
  rent_notice_days: '提前通知天数',
  deposit_cn: '押金大写',
  deposit_num: '押金小写',
  payment_times: '付款次数',
  first_payment: '第一次支付金额',
  second_payment: '第二次支付金额',
  second_payment_time: '第二次支付时间',
  bank_account: '甲方收款账户',
  agency_fee_landlord: '甲方佣金',
  agency_fee_tenant: '乙方佣金',
  items_table: '物品清单',
  meter_readings: '仪表读数',
  extra_terms: '其他约定事项'
};
