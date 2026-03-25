/**
 * 合同模板配置文件
 * 包含HTML模板字段映射关系
 */

// 字段映射接口
export interface TemplateFieldMapping {
  key: string;           // 字段键名
  label: string;         // 中文标签
  type: string;          // 字段类型
  required: boolean;    // 是否必填
  description?: string; // 字段描述
}

// HTML模板字段映射配置
export const templateFieldMappings: TemplateFieldMapping[] = [
  { key: 'party_b_name', label: '乙方姓名', type: 'string', required: true, description: '承租方姓名' },
  { key: 'party_b_idcard', label: '乙方身份证号', type: 'string', required: true, description: '承租方身份证号码' },
  { key: 'party_b_phone', label: '乙方联系电话', type: 'string', required: true, description: '承租方联系电话' },
  { key: 'party_b_agent', label: '乙方委托代理人', type: 'string', required: false, description: '委托代理人姓名' },
  { key: 'property_location', label: '房产位置', type: 'string', required: true, description: '租赁房产地址' },
  { key: 'property_area', label: '建筑面积', type: 'string', required: true, description: '房产建筑面积（平方米）' },
  { key: 'lease_start', label: '租赁开始日期', type: 'date', required: true, description: '租赁合同开始日期' },
  { key: 'lease_end', label: '租赁结束日期', type: 'date', required: true, description: '租赁合同结束日期' },
  { key: 'lease_months', label: '租赁月数', type: 'number', required: true, description: '租赁总月数' },
  { key: 'lease_purpose', label: '租赁用途', type: 'string', required: true, description: '租赁用途说明' },
  { key: 'monthly_rent', label: '月租金', type: 'number', required: true, description: '每月租金金额（元）' },
  { key: 'annual_rent', label: '年租金', type: 'number', required: true, description: '每年租金金额（元）' },
  { key: 'rent_payment_type', label: '租金支付方式', type: 'string', required: true, description: '支付方式：月付/季付/半年/年付' },
  { key: 'rent_notice_days', label: '提前通知天数', type: 'number', required: false, description: '提前通知退租的天数' },
  { key: 'deposit_cn', label: '押金大写', type: 'string', required: true, description: '押金金额大写（如：壹万元整）' },
  { key: 'deposit_num', label: '押金小写', type: 'number', required: true, description: '押金金额小写（元）' },
  { key: 'payment_times', label: '付款次数', type: 'number', required: true, description: '总共付款次数' },
  { key: 'first_payment', label: '第一次支付金额', type: 'number', required: true, description: '首期付款金额（元）' },
  { key: 'second_payment', label: '第二次支付金额', type: 'number', required: false, description: '第二期付款金额（元）' },
  { key: 'second_payment_time', label: '第二次支付时间', type: 'date', required: false, description: '第二期付款时间' },
  { key: 'bank_account', label: '甲方收款账户', type: 'string', required: true, description: '甲方银行账户信息' },
  { key: 'agency_fee_landlord', label: '甲方佣金', type: 'number', required: false, description: '甲方应付佣金金额（元）' },
  { key: 'agency_fee_tenant', label: '乙方佣金', type: 'number', required: false, description: '乙方应付佣金金额（元）' },
  { key: 'items_table', label: '物品清单', type: 'string', required: false, description: '租赁物品清单表格' },
  { key: 'meter_readings', label: '仪表读数', type: 'string', required: false, description: '水电燃气表初始读数' },
  { key: 'extra_terms', label: '其他约定事项', type: 'string', required: false, description: '其他特殊约定条款' }
];

// 字段分组
export const fieldGroups = {
  partyB: {
    label: '乙方信息',
    fields: ['party_b_name', 'party_b_idcard', 'party_b_phone', 'party_b_agent']
  },
  property: {
    label: '房产信息',
    fields: ['property_location', 'property_area', 'lease_purpose']
  },
  lease: {
    label: '租赁期限',
    fields: ['lease_start', 'lease_end', 'lease_months']
  },
  rent: {
    label: '租金信息',
    fields: ['monthly_rent', 'annual_rent', 'rent_payment_type', 'rent_notice_days']
  },
  deposit: {
    label: '押金信息',
    fields: ['deposit_cn', 'deposit_num']
  },
  payment: {
    label: '付款信息',
    fields: ['payment_times', 'first_payment', 'second_payment', 'second_payment_time']
  },
  agency: {
    label: '佣金信息',
    fields: ['bank_account', 'agency_fee_landlord', 'agency_fee_tenant']
  },
  other: {
    label: '其他信息',
    fields: ['items_table', 'meter_readings', 'extra_terms']
  }
};

// 获取字段映射（通过key查找）
export const getFieldMapping = (key: string): TemplateFieldMapping | undefined => {
  return templateFieldMappings.find(mapping => mapping.key === key);
};

// 必填字段列表
export const requiredFields = templateFieldMappings.filter(f => f.required).map(f => f.key);

export default templateFieldMappings;
