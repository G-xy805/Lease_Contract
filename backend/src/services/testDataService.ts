import { query, insert, execute } from '../database';
import { UserRole, RealNameStatus, UserRow } from '../models/User';
import { ContractStatus, PaymentMethod, ContractRow } from '../models/Contract';
import { RowDataPacket } from 'mysql2';

export interface TestUser {
  id: number;
  phone: string;
  name: string;
  role: UserRole;
  real_name_status: number;
  status: number;
  idcard?: string;
}

export interface TestContract {
  id: number;
  contract_no: string;
  title: string;
  status: ContractStatus;
  lessor_user_id: number;
  created_by: number;
  partyA_company: string;
  partyA_phone: string;
  partyA_idcard: string | null;
  partyB_name: string;
  partyB_phone: string;
  house_address: string;
  house_area: number;
  rent_purpose: string;
  lease_start: string;
  lease_end: string;
  lease_months: number;
  advance_notice_days: number;
  monthly_rent: number;
  year_rent: number;
  payment_method: PaymentMethod;
  payment_cycle: number;
  payment_count: number;
  deposit: number;
  deposit_chinese: string;
  total_amount: number;
  partyA_sign_status: number;
  partyB_sign_status: number;
  partyA_signed_at: string | null;
  partyB_signed_at: string | null;
  invite_code: string | null;
  reject_reason: string | null;
  intermediary_name?: string | null;
  inventory_items: string;
  fee_items: string;
  electricity_meter: string;
  water_meter: string;
  gas_meter: string;
}

const generateInviteCode = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LC${year}${month}${day}${random}`;
};

export const testDataService = {
  async generateTestUsers(): Promise<TestUser[]> {
    const testUsers: TestUser[] = [
      { id: 1, phone: '13800000001', name: '系统管理员', role: UserRole.ADMIN, real_name_status: RealNameStatus.VERIFIED, status: 0, idcard: '510101199001011234' },
      { id: 2, phone: '13800000011', name: '张房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.VERIFIED, status: 0, idcard: '510101199001012345' },
      { id: 3, phone: '13800000012', name: '李房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.VERIFIED, status: 0, idcard: '510101199001013456' },
      { id: 4, phone: '13800000013', name: '王房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.NONE, status: 0 },
      { id: 5, phone: '13800000014', name: '赵房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.VERIFIED, status: 0 },
      { id: 6, phone: '13800000015', name: '钱房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.VERIFIED, status: 1, idcard: '510101199001015678' },
      { id: 7, phone: '13800000021', name: '张租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: 0, idcard: '510101199001017890' },
      { id: 8, phone: '13800000022', name: '李租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: 0, idcard: '510101199001018901' },
      { id: 9, phone: '13800000023', name: '王租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.NONE, status: 0 },
      { id: 10, phone: '13800000024', name: '赵租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: 0, idcard: '510101199001011112' },
      { id: 11, phone: '13800000025', name: '钱租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: 0, idcard: '510101199001012223' },
      { id: 12, phone: '13800000026', name: '孙租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.NONE, status: 0 },
      { id: 13, phone: '13800000027', name: '周租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: 1, idcard: '510101199001013334' },
      { id: 14, phone: '13800000028', name: '吴租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: 0 }
    ];
    return testUsers;
  },

  async generateTestContracts(): Promise<TestContract[]> {
    const now = new Date().toISOString();
    const testContracts: TestContract[] = [
      {
        id: 1, contract_no: 'LC20260301001', title: '房屋租赁合同 - 四川省成都市武侯区天府大道100号',
        status: ContractStatus.PENDING_LESSOR_SIGN, lessor_user_id: 2, created_by: 2,
        partyA_company: '张房东', partyA_phone: '13800000011', partyA_idcard: '510101199001012345',
        partyB_name: '张租客', partyB_phone: '13800000021',
        house_address: '四川省成都市武侯区天府大道100号1栋1单元1001', house_area: 120.50, rent_purpose: '居住',
        lease_start: '2026-04-01', lease_end: '2027-03-31', lease_months: 12, advance_notice_days: 30,
        monthly_rent: 3000, year_rent: 36000, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1, payment_count: 12,
        deposit: 3000, deposit_chinese: '叁仟元整', total_amount: 39000,
        partyA_sign_status: 0, partyB_sign_status: 0, partyA_signed_at: null, partyB_signed_at: null,
        invite_code: null, reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 1, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 2, templateField: 'item_ac_qty' },
          { name: '冰箱', quantity: 1, templateField: 'item_fridge_qty' },
          { name: '洗衣机', quantity: 1, templateField: 'item_washer_qty' },
          { name: '床', quantity: 2, templateField: 'item_bed_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: false }, { name: '暖气费', checked: false }]),
        electricity_meter: '12345.6', water_meter: '678.9', gas_meter: '123.45'
      },
      {
        id: 2, contract_no: 'LC20260301002', title: '房屋租赁合同 - 四川省成都市锦江区红星路200号',
        status: ContractStatus.PENDING_LESSOR_SIGN, lessor_user_id: 2, created_by: 2,
        partyA_company: '张房东', partyA_phone: '13800000011', partyA_idcard: '510101199001012345',
        partyB_name: '李租客', partyB_phone: '13800000022',
        house_address: '四川省成都市锦江区红星路200号2栋2单元2002', house_area: 89.00, rent_purpose: '居住',
        lease_start: '2026-04-15', lease_end: '2026-07-14', lease_months: 3, advance_notice_days: 15,
        monthly_rent: 4500, year_rent: 54000, payment_method: PaymentMethod.PAY_THREE_MONTHS, payment_cycle: 3, payment_count: 1,
        deposit: 4500, deposit_chinese: '肆仟伍佰元整', total_amount: 18000,
        partyA_sign_status: 0, partyB_sign_status: 0, partyA_signed_at: null, partyB_signed_at: null,
        invite_code: null, reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 1, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 1, templateField: 'item_ac_qty' },
          { name: '床', quantity: 1, templateField: 'item_bed_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: true }, { name: '暖气费', checked: true }]),
        electricity_meter: '23456.7', water_meter: '789.0', gas_meter: '234.56'
      },
      {
        id: 3, contract_no: 'LC20260302001', title: '房屋租赁合同 - 四川省成都市青羊区少城路50号',
        status: ContractStatus.PENDING_LESSEE_SIGN, lessor_user_id: 3, created_by: 3,
        partyA_company: '李房东', partyA_phone: '13800000012', partyA_idcard: '510101199001013456',
        partyB_name: '王租客', partyB_phone: '13800000023',
        house_address: '四川省成都市青羊区少城路50号3栋3单元3003', house_area: 150.00, rent_purpose: '居住',
        lease_start: '2026-05-01', lease_end: '2027-04-30', lease_months: 12, advance_notice_days: 30,
        monthly_rent: 5000, year_rent: 60000, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1, payment_count: 12,
        deposit: 5000, deposit_chinese: '伍仟元整', total_amount: 65000,
        partyA_sign_status: 1, partyB_sign_status: 0, partyA_signed_at: now, partyB_signed_at: null,
        invite_code: generateInviteCode(), reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 2, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 3, templateField: 'item_ac_qty' },
          { name: '冰箱', quantity: 1, templateField: 'item_fridge_qty' },
          { name: '洗衣机', quantity: 1, templateField: 'item_washer_qty' },
          { name: '床', quantity: 3, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 2, templateField: 'item_sofa_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: false }, { name: '暖气费', checked: false }]),
        electricity_meter: '34567.8', water_meter: '890.1', gas_meter: '345.67'
      },
      {
        id: 4, contract_no: 'LC20260302002', title: '房屋租赁合同 - 四川省成都市金牛区交大路180号',
        status: ContractStatus.PENDING_LESSEE_SIGN, lessor_user_id: 3, created_by: 3,
        partyA_company: '李房东', partyA_phone: '13800000012', partyA_idcard: '510101199001013456',
        partyB_name: '赵租客', partyB_phone: '13800000024',
        house_address: '四川省成都市金牛区交大路180号4栋4单元4004', house_area: 95.50, rent_purpose: '商用',
        lease_start: '2026-05-15', lease_end: '2026-08-14', lease_months: 3, advance_notice_days: 15,
        monthly_rent: 3500, year_rent: 42000, payment_method: PaymentMethod.PAY_THREE_MONTHS, payment_cycle: 3, payment_count: 1,
        deposit: 3500, deposit_chinese: '叁仟伍佰元整', total_amount: 14000,
        partyA_sign_status: 1, partyB_sign_status: 0, partyA_signed_at: now, partyB_signed_at: null,
        invite_code: generateInviteCode(), reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '空调', quantity: 2, templateField: 'item_ac_qty' },
          { name: '床', quantity: 1, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 1, templateField: 'item_sofa_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: false }, { name: '物业费', checked: true }, { name: '暖气费', checked: false }]),
        electricity_meter: '45678.9', water_meter: '901.2', gas_meter: '456.78'
      },
      {
        id: 5, contract_no: 'LC20260302003', title: '房屋租赁合同 - 四川省成都市成华区建设路300号',
        status: ContractStatus.PENDING_LESSEE_SIGN, lessor_user_id: 4, created_by: 4,
        partyA_company: '王房东', partyA_phone: '13800000013', partyA_idcard: null,
        partyB_name: '钱租客', partyB_phone: '13800000025',
        house_address: '四川省成都市成华区建设路300号5栋5单元5005', house_area: 80.00, rent_purpose: '居住',
        lease_start: '2026-06-01', lease_end: '2026-08-31', lease_months: 3, advance_notice_days: 15,
        monthly_rent: 2800, year_rent: 33600, payment_method: PaymentMethod.PAY_SIX_MONTHS, payment_cycle: 6, payment_count: 1,
        deposit: 2800, deposit_chinese: '贰仟捌佰元整', total_amount: 16800,
        partyA_sign_status: 1, partyB_sign_status: 0, partyA_signed_at: now, partyB_signed_at: null,
        invite_code: generateInviteCode(), reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '空调', quantity: 1, templateField: 'item_ac_qty' },
          { name: '床', quantity: 1, templateField: 'item_bed_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: false }, { name: '暖气费', checked: false }]),
        electricity_meter: '56789.0', water_meter: '123.4', gas_meter: '567.89'
      },
      {
        id: 6, contract_no: 'LC20260303001', title: '房屋租赁合同 - 四川省成都市高新区天府大道500号',
        status: ContractStatus.SIGNED, lessor_user_id: 2, created_by: 2,
        partyA_company: '张房东', partyA_phone: '13800000011', partyA_idcard: '510101199001012345',
        partyB_name: '孙租客', partyB_phone: '13800000026',
        house_address: '四川省成都市高新区天府大道500号6栋6单元6006', house_area: 200.00, rent_purpose: '商用',
        lease_start: '2026-04-01', lease_end: '2027-03-31', lease_months: 12, advance_notice_days: 30,
        monthly_rent: 8000, year_rent: 96000, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1, payment_count: 12,
        deposit: 8000, deposit_chinese: '捌仟元整', total_amount: 104000,
        partyA_sign_status: 1, partyB_sign_status: 1, partyA_signed_at: now, partyB_signed_at: now,
        invite_code: generateInviteCode(), reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 2, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 4, templateField: 'item_ac_qty' },
          { name: '冰箱', quantity: 2, templateField: 'item_fridge_qty' },
          { name: '洗衣机', quantity: 2, templateField: 'item_washer_qty' },
          { name: '床', quantity: 3, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 2, templateField: 'item_sofa_qty' },
          { name: '餐桌', quantity: 1, templateField: 'item_dining_table_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: true }, { name: '暖气费', checked: true }]),
        electricity_meter: '11111.1', water_meter: '222.2', gas_meter: '333.33'
      },
      {
        id: 7, contract_no: 'LC20260303002', title: '房屋租赁合同 - 四川省成都市武侯区科华北路60号',
        status: ContractStatus.SIGNED, lessor_user_id: 2, created_by: 2,
        partyA_company: '张房东', partyA_phone: '13800000011', partyA_idcard: '510101199001012345',
        partyB_name: '周租客', partyB_phone: '13800000027',
        house_address: '四川省成都市武侯区科华北路60号7栋7单元7007', house_area: 110.00, rent_purpose: '居住',
        lease_start: '2026-04-01', lease_end: '2027-03-31', lease_months: 12, advance_notice_days: 30,
        monthly_rent: 4000, year_rent: 48000, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1, payment_count: 12,
        deposit: 4000, deposit_chinese: '肆仟元整', total_amount: 52000,
        partyA_sign_status: 1, partyB_sign_status: 1, partyA_signed_at: now, partyB_signed_at: now,
        invite_code: generateInviteCode(), reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 1, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 2, templateField: 'item_ac_qty' },
          { name: '冰箱', quantity: 1, templateField: 'item_fridge_qty' },
          { name: '洗衣机', quantity: 1, templateField: 'item_washer_qty' },
          { name: '床', quantity: 2, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 1, templateField: 'item_sofa_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: false }, { name: '暖气费', checked: false }]),
        electricity_meter: '22222.2', water_meter: '333.3', gas_meter: '444.44'
      },
      {
        id: 8, contract_no: 'LC20260303003', title: '房屋租赁合同 - 四川省成都市锦江区春熙路100号',
        status: ContractStatus.SIGNED, lessor_user_id: 3, created_by: 3,
        partyA_company: '李房东', partyA_phone: '13800000012', partyA_idcard: '510101199001013456',
        partyB_name: '吴租客', partyB_phone: '13800000028',
        house_address: '四川省成都市锦江区春熙路100号8栋8单元8008', house_area: 180.00, rent_purpose: '商用',
        lease_start: '2026-05-01', lease_end: '2027-04-30', lease_months: 12, advance_notice_days: 30,
        monthly_rent: 10000, year_rent: 120000, payment_method: PaymentMethod.PAY_YEARLY, payment_cycle: 12, payment_count: 1,
        deposit: 10000, deposit_chinese: '壹万元整', total_amount: 130000,
        partyA_sign_status: 1, partyB_sign_status: 1, partyA_signed_at: now, partyB_signed_at: now,
        invite_code: generateInviteCode(), reject_reason: null,
        intermediary_name: '成都房产中介公司',
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 3, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 5, templateField: 'item_ac_qty' },
          { name: '冰箱', quantity: 2, templateField: 'item_fridge_qty' },
          { name: '洗衣机', quantity: 2, templateField: 'item_washer_qty' },
          { name: '床', quantity: 4, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 3, templateField: 'item_sofa_qty' },
          { name: '餐桌', quantity: 2, templateField: 'item_dining_table_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: true }, { name: '暖气费', checked: true }]),
        electricity_meter: '33333.3', water_meter: '444.4', gas_meter: '555.55'
      },
      {
        id: 9, contract_no: 'LC20260304001', title: '房屋租赁合同 - 四川省成都市青羊区金沙路150号',
        status: ContractStatus.REJECTED, lessor_user_id: 3, created_by: 3,
        partyA_company: '李房东', partyA_phone: '13800000012', partyA_idcard: '510101199001013456',
        partyB_name: '张租客', partyB_phone: '13800000021',
        house_address: '四川省成都市青羊区金沙路150号9栋9单元9009', house_area: 75.00, rent_purpose: '居住',
        lease_start: '2026-06-01', lease_end: '2026-08-31', lease_months: 3, advance_notice_days: 15,
        monthly_rent: 2500, year_rent: 30000, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1, payment_count: 3,
        deposit: 2500, deposit_chinese: '贰仟伍佰元整', total_amount: 10000,
        partyA_sign_status: 1, partyB_sign_status: 0, partyA_signed_at: now, partyB_signed_at: null,
        invite_code: generateInviteCode(), reject_reason: '租金太高不想租了',
        inventory_items: JSON.stringify([
          { name: '空调', quantity: 1, templateField: 'item_ac_qty' },
          { name: '床', quantity: 1, templateField: 'item_bed_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: false }, { name: '暖气费', checked: false }]),
        electricity_meter: '44444.4', water_meter: '555.5', gas_meter: '666.66'
      },
      {
        id: 10, contract_no: 'LC20260304002', title: '房屋租赁合同 - 四川省成都市金牛区人民北路50号',
        status: ContractStatus.REJECTED, lessor_user_id: 4, created_by: 4,
        partyA_company: '王房东', partyA_phone: '13800000013', partyA_idcard: null,
        partyB_name: '李租客', partyB_phone: '13800000022',
        house_address: '四川省成都市金牛区人民北路50号10栋10单元10010', house_area: 130.00, rent_purpose: '居住',
        lease_start: '2026-07-01', lease_end: '2026-09-30', lease_months: 3, advance_notice_days: 15,
        monthly_rent: 3800, year_rent: 45600, payment_method: PaymentMethod.PAY_THREE_MONTHS, payment_cycle: 3, payment_count: 1,
        deposit: 3800, deposit_chinese: '叁仟捌佰元整', total_amount: 15200,
        partyA_sign_status: 1, partyB_sign_status: 0, partyA_signed_at: now, partyB_signed_at: null,
        invite_code: generateInviteCode(), reject_reason: '房屋位置不合适',
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 1, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 2, templateField: 'item_ac_qty' },
          { name: '床', quantity: 2, templateField: 'item_bed_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: true }, { name: '暖气费', checked: false }]),
        electricity_meter: '55555.5', water_meter: '666.6', gas_meter: '777.77'
      },
      {
        id: 11, contract_no: 'LC20260305001', title: '房屋租赁合同 - 四川省成都市成华区万象城200号',
        status: ContractStatus.CANCELLED, lessor_user_id: 2, created_by: 2,
        partyA_company: '张房东', partyA_phone: '13800000011', partyA_idcard: '510101199001012345',
        partyB_name: '王租客', partyB_phone: '13800000023',
        house_address: '四川省成都市成华区万象城200号11栋11单元11011', house_area: 88.00, rent_purpose: '居住',
        lease_start: '2026-04-01', lease_end: '2026-06-30', lease_months: 3, advance_notice_days: 15,
        monthly_rent: 3200, year_rent: 38400, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1, payment_count: 3,
        deposit: 3200, deposit_chinese: '叁仟贰佰元整', total_amount: 12800,
        partyA_sign_status: 0, partyB_sign_status: 0, partyA_signed_at: null, partyB_signed_at: null,
        invite_code: null, reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '空调', quantity: 1, templateField: 'item_ac_qty' },
          { name: '床', quantity: 1, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 1, templateField: 'item_sofa_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: false }, { name: '暖气费', checked: false }]),
        electricity_meter: '66666.6', water_meter: '777.7', gas_meter: '888.88'
      },
      {
        id: 12, contract_no: 'LC20260305002', title: '房屋租赁合同 - 四川省成都市高新区天府二街100号',
        status: ContractStatus.CANCELLED, lessor_user_id: 3, created_by: 3,
        partyA_company: '李房东', partyA_phone: '13800000012', partyA_idcard: '510101199001013456',
        partyB_name: '赵租客', partyB_phone: '13800000024',
        house_address: '四川省成都市高新区天府二街100号12栋12单元12012', house_area: 160.00, rent_purpose: '商用',
        lease_start: '2026-05-01', lease_end: '2027-04-30', lease_months: 12, advance_notice_days: 30,
        monthly_rent: 6000, year_rent: 72000, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1, payment_count: 12,
        deposit: 6000, deposit_chinese: '陆仟元整', total_amount: 78000,
        partyA_sign_status: 0, partyB_sign_status: 0, partyA_signed_at: null, partyB_signed_at: null,
        invite_code: null, reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 2, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 3, templateField: 'item_ac_qty' },
          { name: '冰箱', quantity: 1, templateField: 'item_fridge_qty' },
          { name: '床', quantity: 2, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 2, templateField: 'item_sofa_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: true }, { name: '暖气费', checked: true }]),
        electricity_meter: '77777.7', water_meter: '888.8', gas_meter: '999.99'
      },
      {
        id: 13, contract_no: 'LC20260306001', title: '房屋租赁合同 - 四川省成都市武侯区玉林路80号',
        status: ContractStatus.SIGNED, lessor_user_id: 5, created_by: 5,
        partyA_company: '赵房东', partyA_phone: '13800000014', partyA_idcard: null,
        partyB_name: '张租客', partyB_phone: '13800000021',
        house_address: '四川省成都市武侯区玉林路80号13栋13单元13013', house_area: 100.00, rent_purpose: '居住',
        lease_start: '2026-06-01', lease_end: '2027-05-31', lease_months: 12, advance_notice_days: 30,
        monthly_rent: 3500, year_rent: 42000, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1, payment_count: 12,
        deposit: 3500, deposit_chinese: '叁仟伍佰元整', total_amount: 45500,
        partyA_sign_status: 1, partyB_sign_status: 1, partyA_signed_at: now, partyB_signed_at: now,
        invite_code: generateInviteCode(), reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 1, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 2, templateField: 'item_ac_qty' },
          { name: '冰箱', quantity: 1, templateField: 'item_fridge_qty' },
          { name: '床', quantity: 2, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 1, templateField: 'item_sofa_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: false }, { name: '暖气费', checked: false }]),
        electricity_meter: '88888.8', water_meter: '999.9', gas_meter: '111.11'
      },
      {
        id: 14, contract_no: 'LC20260306002', title: '房屋租赁合同 - 四川省成都市锦江区东大街300号',
        status: ContractStatus.PENDING_LESSEE_SIGN, lessor_user_id: 2, created_by: 2,
        partyA_company: '张房东', partyA_phone: '13800000011', partyA_idcard: '510101199001012345',
        partyB_name: '吴租客', partyB_phone: '13800000028',
        house_address: '四川省成都市锦江区东大街300号14栋14单元14014', house_area: 250.00, rent_purpose: '商用',
        lease_start: '2026-04-01', lease_end: '2028-03-31', lease_months: 24, advance_notice_days: 60,
        monthly_rent: 15000, year_rent: 180000, payment_method: PaymentMethod.PAY_YEARLY, payment_cycle: 12, payment_count: 2,
        deposit: 15000, deposit_chinese: '壹万伍仟元整', total_amount: 195000,
        partyA_sign_status: 1, partyB_sign_status: 0, partyA_signed_at: now, partyB_signed_at: null,
        invite_code: generateInviteCode(), reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 4, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 6, templateField: 'item_ac_qty' },
          { name: '冰箱', quantity: 3, templateField: 'item_fridge_qty' },
          { name: '洗衣机', quantity: 2, templateField: 'item_washer_qty' },
          { name: '床', quantity: 5, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 4, templateField: 'item_sofa_qty' },
          { name: '餐桌', quantity: 2, templateField: 'item_dining_table_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: true }, { name: '暖气费', checked: true }]),
        electricity_meter: '99999.9', water_meter: '111.1', gas_meter: '222.22'
      },
      {
        id: 15, contract_no: 'LC20260306003', title: '房屋租赁合同 - 四川省成都市青羊区宽窄巷子50号',
        status: ContractStatus.PENDING_LESSOR_SIGN, lessor_user_id: 3, created_by: 3,
        partyA_company: '李房东', partyA_phone: '13800000012', partyA_idcard: '510101199001013456',
        partyB_name: '钱租客', partyB_phone: '13800000025',
        house_address: '四川省成都市青羊区宽窄巷子50号15栋15单元15015', house_area: 140.00, rent_purpose: '居住',
        lease_start: '2026-07-01', lease_end: '2027-06-30', lease_months: 12, advance_notice_days: 30,
        monthly_rent: 28000, year_rent: 336000, payment_method: PaymentMethod.PAY_YEARLY, payment_cycle: 12, payment_count: 1,
        deposit: 28000, deposit_chinese: '贰万捌仟元整', total_amount: 364000,
        partyA_sign_status: 0, partyB_sign_status: 0, partyA_signed_at: null, partyB_signed_at: null,
        invite_code: null, reject_reason: null,
        inventory_items: JSON.stringify([
          { name: '电视', quantity: 3, templateField: 'item_tv_qty' },
          { name: '空调', quantity: 4, templateField: 'item_ac_qty' },
          { name: '冰箱', quantity: 2, templateField: 'item_fridge_qty' },
          { name: '洗衣机', quantity: 2, templateField: 'item_washer_qty' },
          { name: '床', quantity: 3, templateField: 'item_bed_qty' },
          { name: '沙发', quantity: 2, templateField: 'item_sofa_qty' },
          { name: '衣柜', quantity: 3, templateField: 'item_wardrobe_qty' }
        ]),
        fee_items: JSON.stringify([{ name: '水费', checked: true }, { name: '电费', checked: true }, { name: '燃气费', checked: true }, { name: '物业费', checked: true }, { name: '暖气费', checked: true }]),
        electricity_meter: '10101.0', water_meter: '202.0', gas_meter: '303.03'
      }
    ];
    return testContracts;
  },

  async insertTestUsers(users: TestUser[]): Promise<void> {
    for (const user of users) {
      const now = new Date().toISOString();
      await insert(
        `INSERT INTO users (id, phone, name, idcard, role, real_name_status, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.phone, user.name, user.idcard || null, user.role, user.real_name_status, user.status, now, now]
      );
    }
  },

  async insertTestContracts(contracts: TestContract[]): Promise<void> {
    for (const contract of contracts) {
      const now = new Date().toISOString();
      const insertColumns = [
        'id', 'contract_no', 'title', 'lessor_user_id', 'created_by',
        'partyA_company', 'partyA_contact', 'partyA_phone', 'partyA_phone2', 'partyA_idcard', 'partyA_account',
        'partyB_name', 'partyB_phone', 'partyB_idCard', 'partyB_contact',
        'house_address', 'house_area', 'rent_purpose',
        'lease_start', 'lease_end', 'lease_months', 'advance_notice_days',
        'monthly_rent', 'year_rent', 'total_amount',
        'payment_method', 'payment_cycle', 'payment_count',
        'first_payment_amount', 'first_payment_date', 'second_payment_amount', 'second_payment_date', 'third_payment_amount',
        'deposit', 'deposit_chinese',
        'fee_items',
        'partyA_commission', 'partyA_commission_chinese', 'partyB_commission', 'partyB_commission_chinese',
        'electricity_meter', 'water_meter', 'gas_meter',
        'remark', 'intermediary_name', 'inventory_items',
        'status', 'created_at', 'updated_at',
        'partyA_sign_status', 'partyB_sign_status', 'partyA_signed_at', 'partyB_signed_at', 'invite_code', 'reject_reason'
      ];
      const placeholders = insertColumns.map(() => '?').join(', ');
      const values = [
        contract.id, contract.contract_no, contract.title, contract.lessor_user_id, contract.created_by,
        contract.partyA_company, null, contract.partyA_phone, null, contract.partyA_idcard, null,
        contract.partyB_name, contract.partyB_phone, null, null,
        contract.house_address, contract.house_area, contract.rent_purpose,
        contract.lease_start, contract.lease_end, contract.lease_months, contract.advance_notice_days,
        contract.monthly_rent, contract.year_rent, contract.total_amount,
        contract.payment_method, contract.payment_cycle, contract.payment_count,
        null, null, null, null, null,
        contract.deposit, contract.deposit_chinese,
        contract.fee_items,
        null, null, null, null,
        contract.electricity_meter, contract.water_meter, contract.gas_meter,
        null, contract.intermediary_name || null, contract.inventory_items,
        contract.status, now, now,
        contract.partyA_sign_status, contract.partyB_sign_status, contract.partyA_signed_at, contract.partyB_signed_at, contract.invite_code, contract.reject_reason
      ];
      await insert(
        `INSERT INTO contracts (${insertColumns.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }
  },

  async clearTestData(): Promise<void> {
    await execute('DELETE FROM contracts WHERE id >= 1 AND id <= 15');
    await execute('DELETE FROM users WHERE id >= 1 AND id <= 14');
  },

  async resetTestData(): Promise<{ users: TestUser[]; contracts: TestContract[] }> {
    await this.clearTestData();
    const users = await this.generateTestUsers();
    const contracts = await this.generateTestContracts();
    await this.insertTestUsers(users);
    await this.insertTestContracts(contracts);
    return { users, contracts };
  },

  async getTestUsers(): Promise<TestUser[]> {
    const users = await query<TestUser[]>('SELECT * FROM users WHERE id >= 1 AND id <= 14 ORDER BY id');
    return users;
  },

  async getTestContracts(): Promise<TestContract[]> {
    const contracts = await query<TestContract[]>('SELECT * FROM contracts WHERE id >= 1 AND id <= 15 ORDER BY id');
    return contracts;
  },

  async getTestContractById(id: number): Promise<TestContract | null> {
    const contracts = await query<TestContract[]>('SELECT * FROM contracts WHERE id = ?', [id]);
    return contracts.length > 0 ? contracts[0] : null;
  }
};
