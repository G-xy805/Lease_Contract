import { RowDataPacket } from 'mysql2';

// 签署角色枚举
export enum SignRole {
  LESSOR = 'LESSOR',   // 甲方/出租方
  LESSEE = 'LESSEE'    // 乙方/承租方
}

// 签署状态枚举
export enum SignStatus {
  PENDING = 0,      // 待确认
  CONFIRMED = 1,    // 已确认
  REVOKED = 2       // 已撤销
}

// 签署类型枚举（保留用于兼容旧代码）
export enum SignType {
  HAND_WRITE = 'hand_write',   // 手写签名
  IMAGE_UPLOAD = 'image_upload', // 图片上传签名
  DIGITAL = 'digital'           // 数字签名
}

// 签署记录接口
export interface ISignature {
  id: number;
  contract_id: number;
  user_id: number | null;
  sign_role: SignRole;             // 签署方角色（替代原来的 sign_type）
  sign_name: string;               // 签署人姓名
  sign_phone: string | null;       // 签署人手机号
  signature_data: string;          // Base64 编码的签名图片
  sign_status: SignStatus;         // 签署状态
  ip_address: string | null;       // 签署时IP地址
  device_info: string | null;      // 签署设备信息
  sign_location: string | null;    // 签署地理位置
  signed_at: Date;                 // 签署时间
  created_at: Date;                // 创建时间
}

// 签署记录行数据
export interface SignatureRow extends RowDataPacket, ISignature {}

// 创建签署记录数据
export interface ICreateSignature {
  contract_id: number;
  user_id: number | null;
  sign_role: SignRole;
  sign_name: string;
  sign_phone?: string | null;
  signature_data: string;
  sign_status?: SignStatus;
  ip_address?: string | null;
  device_info?: string | null;
  sign_location?: string | null;
}

// 签署记录响应
export interface ISignatureResponse {
  id: number;
  contract_id: number;
  user_id: number | null;
  sign_role: SignRole;
  sign_name: string;
  sign_phone: string | null;
  signature_data: string;
  sign_status: SignStatus;
  ip_address: string | null;
  device_info: string | null;
  sign_location: string | null;
  signed_at: Date;
}

// 签署记录列表响应
export interface ISignatureListResponse {
  total: number;
  list: ISignatureResponse[];
}

// 合同状态枚举
export enum ContractStatus {
  DRAFT = 'draft',                 // 草稿
  PENDING_LESSOR_SIGN = 'pending_lessor_sign', // 待甲方签署
  PENDING_TENANT_SIGN = 'pending_tenant_sign', // 待乙方签署
  SIGNED = 'signed',               // 已签署
  CANCELLED = 'cancelled',         // 已取消
  EXPIRED = 'expired'              // 已过期
}

// 合同信息（用于验证签署流程）
export interface IContract extends RowDataPacket {
  id: number;
  status: ContractStatus;
  lessor_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}
