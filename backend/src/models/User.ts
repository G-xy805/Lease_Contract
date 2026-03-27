import { RowDataPacket } from 'mysql2';

// 用户角色枚举
export enum UserRole {
  LESSOR = 'LESSOR',   // 甲方（出租方）- 房东
  LESSEE = 'LESSEE',   // 乙方（承租方）- 租客
  ADMIN = 'ADMIN'      // 系统管理员
}

// 用户状态枚举
export enum UserStatus {
  NORMAL = 0,   // 正常
  BANNED = 1    // 封禁
}

// 实名认证状态枚举
export enum RealNameStatus {
  NONE = 0,      // 未认证
  PENDING = 1,   // 认证中
  VERIFIED = 2,  // 已认证
  FAILED = 3     // 认证失败
}

// 用户接口
export interface IUser {
  id: number;
  openid: string | null;
  phone: string;
  name: string | null;
  idcard: string | null;
  real_name_status: RealNameStatus;
  real_name_at: Date | null;
  role: UserRole;
  status: UserStatus;  // 账号状态（0:正常, 1:封禁）
  created_at: Date;
  updated_at: Date;
}

// 用户表行数据
export interface UserRow extends RowDataPacket, IUser {}

// 用户注册数据
export interface IUserRegister {
  openid?: string;
  phone: string;
  name?: string;
  role?: UserRole;
}

// 用户登录数据
export interface IUserLogin {
  openid?: string;
  phone?: string;
  code?: string;
}

// 用户信息更新数据
export interface IUserProfileUpdate {
  name?: string;
}

// 实名认证数据
export interface IRealNameVerify {
  name: string;
  idcard: string;
  idcard_front?: string;
  idcard_back?: string;
}

// JWT Payload
export interface IUserPayload {
  userId: number;
  openid: string | null;
  phone: string;
  role: UserRole;
}

// 用户登录响应
export interface IUserLoginResponse {
  token: string;
  user: {
    id: number;
    openid: string | null;
    phone: string;
    name: string | null;
    real_name_status: RealNameStatus;
    role: UserRole;
    roleName: string;
    status: UserStatus;
  };
}

// 用户资料响应
export interface IUserProfileResponse {
  id: number;
  openid: string | null;
  phone: string;
  name: string | null;
  idcard: string | null;
  real_name_status: RealNameStatus;
  real_name_at: Date | null;
  role: UserRole;
  roleName: string;
  status: UserStatus;
  created_at: Date;
}

// 发送验证码响应
export interface ISendCodeResponse {
  success: boolean;
  message: string;
  // 本地开发环境返回模拟验证码
  code?: string;
}
