import { RowDataPacket } from 'mysql2';

// 签署邀请状态枚举
export enum InvitationStatus {
  PENDING = 1,    // 待接受
  ACCEPTED = 2,   // 已接受
  REJECTED = 3,   // 已拒绝
  EXPIRED = 4     // 已过期
}

// 签署方类型枚举
export enum SignerType {
  LESSOR = 1,     // 出租方
  LESSEE = 2      // 承租方
}

// 签署邀请接口
export interface ISignInvitation {
  id: number;
  contract_id: number;
  invitation_no: string;
  invite_type: SignerType;
  invite_name: string;
  invite_phone: string;
  invite_email: string | null;
  receiver_type: SignerType;
  receiver_name: string;
  receiver_phone: string;
  receiver_email: string | null;
  status: InvitationStatus;
  expires_at: Date;
  accepted_at: Date | null;
  refused_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

// 签署邀请表行数据
export interface SignInvitationRow extends RowDataPacket, ISignInvitation {}

// 创建签署邀请请求
export interface ICreateInvitation {
  contract_id: number;
  invite_type: SignerType;
  invite_name: string;
  invite_phone: string;
  invite_email?: string;
  receiver_type: SignerType;
  receiver_name: string;
  receiver_phone: string;
  receiver_email?: string;
  expires_in_hours?: number; // 邀请过期时间（小时），默认72小时
}

// 接受邀请请求
export interface IAcceptInvitation {
  receiver_phone: string;  // 接收方手机号（验证身份）
}

// 拒绝邀请请求
export interface IRejectInvitation {
  receiver_phone: string;  // 接收方手机号（验证身份）
  reason?: string;          // 拒绝原因
}

// 签署邀请响应
export interface IInvitationResponse {
  id: number;
  contract_id: number;
  invitation_no: string;
  invite_type: SignerType;
  invite_name: string;
  invite_phone: string;
  invite_email: string | null;
  receiver_type: SignerType;
  receiver_name: string;
  receiver_phone: string;
  receiver_email: string | null;
  status: InvitationStatus;
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
}

// 合同信息响应（通过邀请码获取）
export interface IContractInfoResponse {
  contract_id: number;
  contract_no: string;
  title: string;
  lessor_name: string;
  lessor_phone: string;
  lessee_name: string;
  lessee_phone: string;
  house_address: string;
  house_area: number | null;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  payment_method: number;
  total_amount: number;
  deposit: number;
  status: number;
  effective_at: string | null;
  invitation_status: InvitationStatus;
  invitation_no: string;
  expires_at: Date;
}

// 发送通知响应
export interface INotificationResponse {
  success: boolean;
  message: string;
  notification_type: string;
  recipient: string;
  sent_at?: Date;
}
