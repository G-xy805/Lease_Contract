import { RowDataPacket } from 'mysql2';

// 签署角色枚举
export enum SignRole {
  LESSOR = 'lessor',     // 甲方（出租方）
  TENANT = 'tenant'      // 乙方（承租方）
}

// 签署类型枚举
export enum SignType {
  HAND_WRITE = 'hand_write',   // 手写签名
  IMAGE_UPLOAD = 'image_upload', // 图片上传签名
  DIGITAL = 'digital'           // 数字签名
}

// 签署记录接口
export interface ISignature {
  id: number;
  contract_id: number;
  user_id: number;
  sign_type: SignType;
  sign_role: SignRole;
  sign_image: string;           // 签名图片Base64
  sign_data: string;             // 签名数据（如时间戳等）
  sign_ip: string;               // 签署时IP地址
  sign_device: string;           // 签署设备信息
  sign_location: string | null; // 签署地理位置
  signed_at: Date;              // 签署时间
  created_at: Date;
  updated_at: Date;
}

// 签署记录行数据
export interface SignatureRow extends RowDataPacket, ISignature {}

// 创建签署记录数据
export interface ICreateSignature {
  contract_id: number;
  user_id: number;
  sign_type: SignType;
  sign_role: SignRole;
  sign_image: string;
  sign_data?: string;
  sign_ip: string;
  sign_device: string;
  sign_location?: string;
}

// 签署记录响应
export interface ISignatureResponse {
  id: number;
  contract_id: number;
  user_id: number;
  sign_type: SignType;
  sign_role: SignRole;
  sign_image: string;
  sign_data: string | null;
  sign_ip: string;
  sign_device: string;
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
