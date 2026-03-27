import { query, insert, execute } from '../src/database';
import { UserRole, RealNameStatus, UserStatus } from '../src/models/User';
import { ContractStatus, PaymentMethod } from '../src/models/Contract';

interface IInventoryItem {
  name: string;
  quantity: number;
  templateField: string;
}

interface UserData {
  id: number;
  phone: string;
  name: string;
  role: UserRole;
  real_name_status: RealNameStatus;
  status: UserStatus;
  idcard: string | null;
}

interface ContractData {
  id: number;
  contract_no: string;
  lessor_user_id: number;
  created_by: number;
  partyB_phone: string;
  status: ContractStatus;
  invite_code: string | null;
  reject_reason: string | null;
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
  deposit: number;
  deposit_chinese: string;
  total_amount: number;
  fee_water: boolean;
  fee_electric: boolean;
  fee_gas: boolean;
  fee_property: boolean;
  fee_heating: boolean;
  inventory_items: IInventoryItem[];
  electricity_meter: string;
  water_meter: string;
  gas_meter: string;
}

const INVENTORY_BASIC: IInventoryItem[] = [
  { name: '电视', quantity: 1, templateField: 'item_tv_qty' },
  { name: '空调', quantity: 2, templateField: 'item_ac_qty' },
  { name: '冰箱', quantity: 1, templateField: 'item_fridge_qty' },
  { name: '洗衣机', quantity: 1, templateField: 'item_washer_qty' },
  { name: '床', quantity: 2, templateField: 'item_bed_qty' },
  { name: '沙发', quantity: 1, templateField: 'item_sofa_qty' },
  { name: '餐桌', quantity: 1, templateField: 'item_dining_table_qty' }
];

const INVENTORY_LUXURY: IInventoryItem[] = [
  { name: '电视', quantity: 2, templateField: 'item_tv_qty' },
  { name: '电视（遥控器）', quantity: 2, templateField: 'item_tv_remote_qty' },
  { name: '空调', quantity: 3, templateField: 'item_ac_qty' },
  { name: '空调（遥控器）', quantity: 3, templateField: 'item_ac_remote_qty' },
  { name: '冰箱', quantity: 1, templateField: 'item_fridge_qty' },
  { name: '洗衣机', quantity: 1, templateField: 'item_washer_qty' },
  { name: '床', quantity: 3, templateField: 'item_bed_qty' },
  { name: '床垫子', quantity: 3, templateField: 'item_mattress_qty' },
  { name: '沙发', quantity: 2, templateField: 'item_sofa_qty' },
  { name: '餐桌', quantity: 1, templateField: 'item_dining_table_qty' },
  { name: '餐桌椅子', quantity: 4, templateField: 'item_chair_qty' },
  { name: '衣柜', quantity: 2, templateField: 'item_wardrobe_qty' },
  { name: '电视柜', quantity: 1, templateField: 'item_tv_table_qty' },
  { name: '茶几', quantity: 1, templateField: 'item_coffee_table_qty' },
  { name: '床头柜', quantity: 3, templateField: 'item_nightstand_qty' },
  { name: '窗帘', quantity: 6, templateField: 'item_curtain_qty' },
  { name: '热水器', quantity: 1, templateField: 'item_water_heater_qty' },
  { name: '油烟机', quantity: 1, templateField: 'item_hood_qty' }
];

const INVENTORY_SIMPLE: IInventoryItem[] = [
  { name: '空调', quantity: 1, templateField: 'item_ac_qty' },
  { name: '床', quantity: 1, templateField: 'item_bed_qty' }
];

const userData: UserData[] = [
  { id: 1, phone: '13800000001', name: '系统管理员', role: UserRole.ADMIN, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.NORMAL, idcard: '330101199001011234' },
  { id: 2, phone: '13800000011', name: '张房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.NORMAL, idcard: '330101199001011235' },
  { id: 3, phone: '13800000012', name: '李房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.NORMAL, idcard: '330101199001011236' },
  { id: 4, phone: '13800000013', name: '王房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.NONE, status: UserStatus.NORMAL, idcard: '330101199001011237' },
  { id: 5, phone: '13800000014', name: '赵房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.NORMAL, idcard: null },
  { id: 6, phone: '13800000015', name: '钱房东', role: UserRole.LESSOR, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.BANNED, idcard: '330101199001011239' },
  { id: 7, phone: '13800000021', name: '张租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.NORMAL, idcard: '330101199001012241' },
  { id: 8, phone: '13800000022', name: '李租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.NORMAL, idcard: '330101199001012242' },
  { id: 9, phone: '13800000023', name: '王租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.NONE, status: UserStatus.NORMAL, idcard: '330101199001012243' },
  { id: 10, phone: '13800000024', name: '赵租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.NORMAL, idcard: '330101199001012244' },
  { id: 11, phone: '13800000025', name: '钱租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.NORMAL, idcard: '330101199001012245' },
  { id: 12, phone: '13800000026', name: '孙租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.NONE, status: UserStatus.NORMAL, idcard: '330101199001012246' },
  { id: 13, phone: '13800000027', name: '周租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.BANNED, idcard: '330101199001012247' },
  { id: 14, phone: '13800000028', name: '吴租客', role: UserRole.LESSEE, real_name_status: RealNameStatus.VERIFIED, status: UserStatus.NORMAL, idcard: null }
];

const contractData: ContractData[] = [
  {
    id: 1, contract_no: 'LC20260301001', lessor_user_id: 2, created_by: 2, partyB_phone: '13800000021',
    status: ContractStatus.PENDING_LESSOR_SIGN, invite_code: null, reject_reason: null,
    house_address: '四川省成都市武侯区天府大道100号1栋1单元1001', house_area: 120.50, rent_purpose: '居住',
    lease_start: '2026-04-01', lease_end: '2027-03-31', lease_months: 12, advance_notice_days: 30,
    monthly_rent: 3000.00, year_rent: 36000.00, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1,
    deposit: 3000.00, deposit_chinese: '叁仟元整', total_amount: 39000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: false, fee_heating: false,
    inventory_items: INVENTORY_BASIC, electricity_meter: '12345.6', water_meter: '678.9', gas_meter: '123.45'
  },
  {
    id: 2, contract_no: 'LC20260301002', lessor_user_id: 2, created_by: 2, partyB_phone: '13800000022',
    status: ContractStatus.PENDING_LESSOR_SIGN, invite_code: null, reject_reason: null,
    house_address: '四川省成都市锦江区红星路200号2栋2单元2002', house_area: 89.00, rent_purpose: '居住',
    lease_start: '2026-04-15', lease_end: '2026-07-14', lease_months: 3, advance_notice_days: 15,
    monthly_rent: 4500.00, year_rent: 54000.00, payment_method: PaymentMethod.PAY_THREE_MONTHS, payment_cycle: 3,
    deposit: 4500.00, deposit_chinese: '肆仟伍佰元整', total_amount: 18000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: true, fee_heating: true,
    inventory_items: INVENTORY_SIMPLE, electricity_meter: '23456.7', water_meter: '789.0', gas_meter: '234.56'
  },
  {
    id: 3, contract_no: 'LC20260302001', lessor_user_id: 3, created_by: 3, partyB_phone: '13800000023',
    status: ContractStatus.PENDING_LESSEE_SIGN, invite_code: 'INV20260302001', reject_reason: null,
    house_address: '四川省成都市青羊区少城路50号3栋3单元3003', house_area: 150.00, rent_purpose: '居住',
    lease_start: '2026-05-01', lease_end: '2027-04-30', lease_months: 12, advance_notice_days: 30,
    monthly_rent: 5000.00, year_rent: 60000.00, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1,
    deposit: 5000.00, deposit_chinese: '伍仟元整', total_amount: 65000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: false, fee_heating: false,
    inventory_items: INVENTORY_BASIC, electricity_meter: '34567.8', water_meter: '890.1', gas_meter: '345.67'
  },
  {
    id: 4, contract_no: 'LC20260302002', lessor_user_id: 3, created_by: 3, partyB_phone: '13800000024',
    status: ContractStatus.PENDING_LESSEE_SIGN, invite_code: 'INV20260302002', reject_reason: null,
    house_address: '四川省成都市金牛区交大路180号4栋4单元4004', house_area: 95.50, rent_purpose: '商用',
    lease_start: '2026-05-15', lease_end: '2026-08-14', lease_months: 3, advance_notice_days: 15,
    monthly_rent: 3500.00, year_rent: 42000.00, payment_method: PaymentMethod.PAY_THREE_MONTHS, payment_cycle: 3,
    deposit: 3500.00, deposit_chinese: '叁仟伍佰元整', total_amount: 14000.00,
    fee_water: true, fee_electric: true, fee_gas: false, fee_property: true, fee_heating: false,
    inventory_items: INVENTORY_BASIC, electricity_meter: '45678.9', water_meter: '901.2', gas_meter: '456.78'
  },
  {
    id: 5, contract_no: 'LC20260302003', lessor_user_id: 4, created_by: 4, partyB_phone: '13800000025',
    status: ContractStatus.PENDING_LESSEE_SIGN, invite_code: 'INV20260302003', reject_reason: null,
    house_address: '四川省成都市成华区建设路300号5栋5单元5005', house_area: 80.00, rent_purpose: '居住',
    lease_start: '2026-06-01', lease_end: '2026-08-31', lease_months: 3, advance_notice_days: 15,
    monthly_rent: 2800.00, year_rent: 33600.00, payment_method: PaymentMethod.PAY_SIX_MONTHS, payment_cycle: 6,
    deposit: 2800.00, deposit_chinese: '贰仟捌佰元整', total_amount: 16800.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: false, fee_heating: false,
    inventory_items: INVENTORY_SIMPLE, electricity_meter: '56789.0', water_meter: '123.4', gas_meter: '567.89'
  },
  {
    id: 6, contract_no: 'LC20260303001', lessor_user_id: 2, created_by: 2, partyB_phone: '13800000026',
    status: ContractStatus.SIGNED, invite_code: null, reject_reason: null,
    house_address: '四川省成都市高新区天府大道500号6栋6单元6006', house_area: 200.00, rent_purpose: '商用',
    lease_start: '2026-04-01', lease_end: '2027-03-31', lease_months: 12, advance_notice_days: 30,
    monthly_rent: 8000.00, year_rent: 96000.00, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1,
    deposit: 8000.00, deposit_chinese: '捌仟元整', total_amount: 104000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: true, fee_heating: true,
    inventory_items: INVENTORY_LUXURY, electricity_meter: '11111.1', water_meter: '222.2', gas_meter: '333.33'
  },
  {
    id: 7, contract_no: 'LC20260303002', lessor_user_id: 2, created_by: 2, partyB_phone: '13800000027',
    status: ContractStatus.SIGNED, invite_code: null, reject_reason: null,
    house_address: '四川省成都市武侯区科华北路60号7栋7单元7007', house_area: 110.00, rent_purpose: '居住',
    lease_start: '2026-04-01', lease_end: '2027-03-31', lease_months: 12, advance_notice_days: 30,
    monthly_rent: 4000.00, year_rent: 48000.00, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1,
    deposit: 4000.00, deposit_chinese: '肆仟元整', total_amount: 52000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: false, fee_heating: false,
    inventory_items: INVENTORY_BASIC, electricity_meter: '22222.2', water_meter: '333.3', gas_meter: '444.44'
  },
  {
    id: 8, contract_no: 'LC20260303003', lessor_user_id: 3, created_by: 3, partyB_phone: '13800000028',
    status: ContractStatus.SIGNED, invite_code: null, reject_reason: null,
    house_address: '四川省成都市锦江区春熙路100号8栋8单元8008', house_area: 180.00, rent_purpose: '商用',
    lease_start: '2026-05-01', lease_end: '2027-04-30', lease_months: 12, advance_notice_days: 30,
    monthly_rent: 10000.00, year_rent: 120000.00, payment_method: PaymentMethod.PAY_YEARLY, payment_cycle: 12,
    deposit: 10000.00, deposit_chinese: '壹万元整', total_amount: 130000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: true, fee_heating: true,
    inventory_items: INVENTORY_LUXURY, electricity_meter: '33333.3', water_meter: '444.4', gas_meter: '555.55'
  },
  {
    id: 9, contract_no: 'LC20260304001', lessor_user_id: 3, created_by: 3, partyB_phone: '13800000021',
    status: ContractStatus.REJECTED, invite_code: null, reject_reason: '租金太高不想租了',
    house_address: '四川省成都市青羊区金沙路150号9栋9单元9009', house_area: 75.00, rent_purpose: '居住',
    lease_start: '2026-06-01', lease_end: '2026-08-31', lease_months: 3, advance_notice_days: 15,
    monthly_rent: 2500.00, year_rent: 30000.00, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1,
    deposit: 2500.00, deposit_chinese: '贰仟伍佰元整', total_amount: 10000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: false, fee_heating: false,
    inventory_items: INVENTORY_SIMPLE, electricity_meter: '44444.4', water_meter: '555.5', gas_meter: '666.66'
  },
  {
    id: 10, contract_no: 'LC20260304002', lessor_user_id: 4, created_by: 4, partyB_phone: '13800000022',
    status: ContractStatus.REJECTED, invite_code: null, reject_reason: '房屋位置不合适',
    house_address: '四川省成都市金牛区人民北路50号10栋10单元10010', house_area: 130.00, rent_purpose: '居住',
    lease_start: '2026-07-01', lease_end: '2026-09-30', lease_months: 3, advance_notice_days: 15,
    monthly_rent: 3800.00, year_rent: 45600.00, payment_method: PaymentMethod.PAY_THREE_MONTHS, payment_cycle: 3,
    deposit: 3800.00, deposit_chinese: '叁仟捌佰元整', total_amount: 15200.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: true, fee_heating: false,
    inventory_items: INVENTORY_BASIC, electricity_meter: '55555.5', water_meter: '666.6', gas_meter: '777.77'
  },
  {
    id: 11, contract_no: 'LC20260305001', lessor_user_id: 2, created_by: 2, partyB_phone: '13800000023',
    status: ContractStatus.CANCELLED, invite_code: null, reject_reason: null,
    house_address: '四川省成都市成华区万象城200号11栋11单元11011', house_area: 88.00, rent_purpose: '居住',
    lease_start: '2026-04-01', lease_end: '2026-06-30', lease_months: 3, advance_notice_days: 15,
    monthly_rent: 3200.00, year_rent: 38400.00, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1,
    deposit: 3200.00, deposit_chinese: '叁仟贰佰元整', total_amount: 12800.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: false, fee_heating: false,
    inventory_items: INVENTORY_BASIC, electricity_meter: '66666.6', water_meter: '777.7', gas_meter: '888.88'
  },
  {
    id: 12, contract_no: 'LC20260305002', lessor_user_id: 3, created_by: 3, partyB_phone: '13800000024',
    status: ContractStatus.CANCELLED, invite_code: null, reject_reason: null,
    house_address: '四川省成都市高新区天府二街100号12栋12单元12012', house_area: 160.00, rent_purpose: '商用',
    lease_start: '2026-05-01', lease_end: '2027-04-30', lease_months: 12, advance_notice_days: 30,
    monthly_rent: 6000.00, year_rent: 72000.00, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1,
    deposit: 6000.00, deposit_chinese: '陆仟元整', total_amount: 78000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: true, fee_heating: true,
    inventory_items: INVENTORY_LUXURY, electricity_meter: '77777.7', water_meter: '888.8', gas_meter: '999.99'
  },
  {
    id: 13, contract_no: 'LC20260306001', lessor_user_id: 5, created_by: 5, partyB_phone: '13800000021',
    status: ContractStatus.SIGNED, invite_code: null, reject_reason: null,
    house_address: '四川省成都市武侯区玉林路80号13栋13单元13013', house_area: 100.00, rent_purpose: '居住',
    lease_start: '2026-06-01', lease_end: '2027-05-31', lease_months: 12, advance_notice_days: 30,
    monthly_rent: 3500.00, year_rent: 42000.00, payment_method: PaymentMethod.PAY_ONE_MONTH, payment_cycle: 1,
    deposit: 3500.00, deposit_chinese: '叁仟伍佰元整', total_amount: 45500.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: false, fee_heating: false,
    inventory_items: INVENTORY_BASIC, electricity_meter: '88888.8', water_meter: '999.9', gas_meter: '111.11'
  },
  {
    id: 14, contract_no: 'LC20260306002', lessor_user_id: 2, created_by: 2, partyB_phone: '13800000028',
    status: ContractStatus.PENDING_LESSEE_SIGN, invite_code: 'INV20260306002', reject_reason: null,
    house_address: '四川省成都市锦江区东大街300号14栋14单元14014', house_area: 250.00, rent_purpose: '商用',
    lease_start: '2026-04-01', lease_end: '2028-03-31', lease_months: 24, advance_notice_days: 60,
    monthly_rent: 15000.00, year_rent: 180000.00, payment_method: PaymentMethod.PAY_YEARLY, payment_cycle: 12,
    deposit: 15000.00, deposit_chinese: '壹万伍仟元整', total_amount: 195000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: true, fee_heating: true,
    inventory_items: INVENTORY_LUXURY, electricity_meter: '99999.9', water_meter: '111.1', gas_meter: '222.22'
  },
  {
    id: 15, contract_no: 'LC20260306003', lessor_user_id: 3, created_by: 3, partyB_phone: '13800000025',
    status: ContractStatus.PENDING_LESSOR_SIGN, invite_code: null, reject_reason: null,
    house_address: '四川省成都市青羊区宽窄巷子50号15栋15单元15015', house_area: 140.00, rent_purpose: '居住',
    lease_start: '2026-07-01', lease_end: '2027-06-30', lease_months: 12, advance_notice_days: 30,
    monthly_rent: 28000.00, year_rent: 336000.00, payment_method: PaymentMethod.PAY_YEARLY, payment_cycle: 12,
    deposit: 28000.00, deposit_chinese: '贰万捌仟元整', total_amount: 364000.00,
    fee_water: true, fee_electric: true, fee_gas: true, fee_property: true, fee_heating: true,
    inventory_items: INVENTORY_LUXURY, electricity_meter: '10101.0', water_meter: '202.0', gas_meter: '303.03'
  }
];

async function clearOldData(): Promise<void> {
  console.log('开始清除旧数据...');
  await execute('DELETE FROM contracts');
  await execute('DELETE FROM users');
  console.log('旧数据已清除');
}

async function seedUsers(): Promise<void> {
  console.log('开始生成用户数据...');

  for (const user of userData) {
    const sql = `
      INSERT INTO users (id, phone, name, idcard, real_name_status, real_name_at, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, datetime('now'), datetime('now'))
    `;
    await insert(sql, [
      user.id,
      user.phone,
      user.name,
      user.idcard,
      user.real_name_status,
      user.role,
      user.status
    ]);
  }

  console.log(`已生成 ${userData.length} 个用户`);
}

async function seedContracts(): Promise<void> {
  console.log('开始生成合同数据...');

  for (const contract of contractData) {
    const partyAUser = userData.find(u => u.id === contract.lessor_user_id);
    const partyBUser = userData.find(u => u.phone === contract.partyB_phone);

    const sql = `
      INSERT INTO contracts (
        id, contract_no, title, status, created_by, lessor_user_id,
        partyA_company, partyA_phone, partyA_contact, partyA_idcard,
        partyB_name, partyB_phone, partyB_idCard,
        house_address, house_area, rent_purpose,
        lease_start, lease_end, lease_months, advance_notice_days,
        monthly_rent, year_rent, payment_method, payment_cycle,
        deposit, deposit_chinese, total_amount,
        fee_water, fee_electric, fee_gas, fee_property, fee_heating,
        inventory_items, electricity_meter, water_meter, gas_meter,
        invite_code, reject_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    await insert(sql, [
      contract.id,
      contract.contract_no,
      `租赁合同 - ${contract.house_address.split('市')[1] || contract.house_address}`,
      contract.status,
      contract.created_by,
      contract.lessor_user_id,
      partyAUser?.name || null,
      partyAUser?.phone || null,
      null,
      partyAUser?.idcard || null,
      partyBUser?.name || null,
      partyBUser?.phone || null,
      partyBUser?.idcard || null,
      contract.house_address,
      contract.house_area,
      contract.rent_purpose,
      contract.lease_start,
      contract.lease_end,
      contract.lease_months,
      contract.advance_notice_days,
      contract.monthly_rent,
      contract.year_rent,
      contract.payment_method,
      contract.payment_cycle,
      contract.deposit,
      contract.deposit_chinese,
      contract.total_amount,
      contract.fee_water ? 1 : 0,
      contract.fee_electric ? 1 : 0,
      contract.fee_gas ? 1 : 0,
      contract.fee_property ? 1 : 0,
      contract.fee_heating ? 1 : 0,
      JSON.stringify(contract.inventory_items),
      contract.electricity_meter,
      contract.water_meter,
      contract.gas_meter,
      contract.invite_code,
      contract.reject_reason
    ]);
  }

  console.log(`已生成 ${contractData.length} 份合同`);
}

async function validateData(): Promise<void> {
  console.log('\n========== 数据验证 ==========');

  const userCount = await query<any[]>('SELECT COUNT(*) as count FROM users');
  console.log(`用户总数: ${userCount[0].count} (预期: 14)`);

  const contractCount = await query<any[]>('SELECT COUNT(*) as count FROM contracts');
  console.log(`合同总数: ${contractCount[0].count} (预期: 15)`);

  const userRoleStats = await query<any[]>(`
    SELECT role, COUNT(*) as count FROM users GROUP BY role
  `);
  console.log('\n用户角色分布:');
  for (const stat of userRoleStats) {
    console.log(`  ${stat.role}: ${stat.count}`);
  }

  const contractStatusStats = await query<any[]>(`
    SELECT status, COUNT(*) as count FROM contracts GROUP BY status
  `);
  console.log('\n合同状态分布:');
  const statusNames: Record<number, string> = {
    1: '待甲方签署',
    2: '待乙方签署',
    3: '已签署',
    4: '已拒绝',
    5: '已取消',
    6: '已到期'
  };
  for (const stat of contractStatusStats) {
    console.log(`  状态${stat.status}(${statusNames[stat.status] || '未知'}): ${stat.count}`);
  }

  const pendingInviteCode = await query<any[]>(`
    SELECT COUNT(*) as count FROM contracts WHERE status = 2 AND invite_code IS NOT NULL
  `);
  console.log(`\n待乙方签署且有邀请码的合同: ${pendingInviteCode[0].count} (预期: 3)`);

  const rejectedWithReason = await query<any[]>(`
    SELECT COUNT(*) as count FROM contracts WHERE status = 4 AND reject_reason IS NOT NULL
  `);
  console.log(`已拒绝且有拒绝原因的合同: ${rejectedWithReason[0].count} (预期: 2)`);

  console.log('\n========== 验证完成 ==========');
}

async function main(): Promise<void> {
  try {
    console.log('========================================');
    console.log('      租赁合同系统 - 测试数据生成脚本      ');
    console.log('========================================\n');

    await clearOldData();
    await seedUsers();
    await seedContracts();
    await validateData();

    console.log('\n测试数据生成完成!');
  } catch (error) {
    console.error('生成测试数据时出错:', error);
    throw error;
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
