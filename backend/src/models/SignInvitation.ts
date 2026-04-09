import { RowDataPacket } from 'mysql2';

// 被邀请方角色枚举
export enum InviteeRole {
  LESSOR = 'LESSOR',   // 出租方/甲方
  LESSEE = 'LESSEE'    // 承租方/乙方
}

// 签署邀请状态枚举
export enum InvitationStatus {
  PENDING = 0,      // 待处理
  ACCEPTED = 1,     // 已接受
  REFUSED = 2,      // 已拒绝
  EXPIRED = 3       // 已过期
}

// 签署邀请接口（简化版 - 18个字段）
export interface ISignInvitation {
  id: number;
  contract_id: number;
  invitation_no: string;          // 邀请编号（唯一）
  invite_code: string;            // 邀请码（唯一）
  inviter_id: number;             // 邀请人用户ID
  invitee_name: string;           // 被邀请人姓名
  invitee_phone: string;          // 被邀请人手机号
  invitee_role: InviteeRole;      // 被邀请方角色
  status: InvitationStatus;       // 邀请状态
  expires_at: Date;               // 过期时间
  accepted_at: Date | null;       // 接受时间
  refused_reason: string | null;  // 拒绝原因
  view_count: number;             // 查看次数
  last_viewed_at: Date | null;    // 最后查看时间
  created_at: Date;               // 创建时间
  updated_at: Date;               // 更新时间
}

// 签署邀请表行数据
export interface SignInvitationRow extends RowDataPacket, ISignInvitation {}

// 创建签署邀请请求
export interface ICreateInvitation {
  contract_id: number;
  inviter_id: number;
  invitee_name: string;
  invitee_phone: string;
  invitee_role: InviteeRole;
  expires_in_hours?: number;      // 邀请过期时间（小时），默认72小时
}

// 接受邀请请求
export interface IAcceptInvitation {
  invite_code: string;            // 邀请码（验证身份）
}

// 拒绝邀请请求
export interface IRejectInvitation {
  invite_code: string;            // 邀请码（验证身份）
  reason?: string;                // 拒绝原因
}

// 签署邀请响应
export interface IInvitationResponse {
  id: number;
  contract_id: number;
  invitation_no: string;
  invite_code: string;
  inviter_id: number;
  invitee_name: string;
  invitee_phone: string;
  invitee_role: InviteeRole;
  status: InvitationStatus;
  expires_at: Date;
  accepted_at: Date | null;
  refused_reason: string | null;
  view_count: number;
  last_viewed_at: Date | null;
  created_at: Date;
  contract_title?: string;
  house_address?: string;
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
