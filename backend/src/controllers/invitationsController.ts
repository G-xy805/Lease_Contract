import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { query, insert, execute } from '../database';
import { AuthRequest } from '../middleware/auth';
import {
  ISignInvitation,
  SignInvitationRow,
  ICreateInvitation,
  IAcceptInvitation,
  IRejectInvitation,
  IInvitationResponse,
  IContractInfoResponse,
  INotificationResponse,
  InvitationStatus,
  InviteeRole
} from '../models/SignInvitation';
import { ContractRow } from '../models/Contract';

// 生成8位邀请码
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 生成邀请编号
const generateInvitationNo = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV${timestamp}${random}`;
};

// 转换为邀请响应格式
const toInvitationResponse = (invitation: ISignInvitation & { contract_title?: string; house_address?: string }): IInvitationResponse => {
  return {
    id: invitation.id,
    contract_id: invitation.contract_id,
    invitation_no: invitation.invitation_no,
    invite_code: invitation.invite_code,
    inviter_id: invitation.inviter_id,
    invitee_name: invitation.invitee_name,
    invitee_phone: invitation.invitee_phone,
    invitee_role: invitation.invitee_role,
    status: invitation.status,
    expires_at: invitation.expires_at,
    accepted_at: invitation.accepted_at,
    refused_reason: invitation.refused_reason,
    view_count: invitation.view_count,
    last_viewed_at: invitation.last_viewed_at,
    created_at: invitation.created_at,
    contract_title: invitation.contract_title,
    house_address: invitation.house_address
  };
};

/**
 * POST /api/invitations
 * 创建签署邀请
 * 甲方签署完成后调用此接口创建签署邀请
 */
export const createInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      contract_id,
      invitee_name,
      invitee_phone,
      invitee_role,
      expires_in_hours = 72
    } = req.body as ICreateInvitation;

    // 参数验证
    if (!contract_id || !invitee_name || !invitee_phone || !invitee_role) {
      res.status(400).json({
        code: 400,
        message: '缺少必填参数'
      });
      return;
    }

    // 验证合同是否存在
    const contracts = await query<RowDataPacket[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [contract_id]
    );

    if (contracts.length === 0) {
      res.status(404).json({
        code: 404,
        message: '合同不存在'
      });
      return;
    }

    // 检查合同状态是否为"待签署"或"签署中"
    const contract = contracts[0];
    if (contract.status !== 2 && contract.status !== 3) {
      res.status(400).json({
        code: 400,
        message: '当前合同状态不允许创建签署邀请'
      });
      return;
    }

    // 检查是否已存在有效的签署邀请
    const existingInvitations = await query<SignInvitationRow[]>(
      `SELECT * FROM sign_invitations
       WHERE contract_id = ? AND invitee_role = ? AND status IN (?, ?)`,
      [contract_id, invitee_role, InvitationStatus.PENDING, InvitationStatus.ACCEPTED]
    );

    if (existingInvitations.length > 0) {
      res.status(400).json({
        code: 400,
        message: '该合同已存在有效的签署邀请'
      });
      return;
    }

    // 生成邀请编号和邀请码
    const invitation_no = generateInvitationNo();
    const invite_code = generateInviteCode();
    const expires_at = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // 创建签署邀请记录
    const result = await insert(
      `INSERT INTO sign_invitations
       (contract_id, invitation_no, invite_code, inviter_id, invitee_name, invitee_phone,
        invitee_role, status, expires_at, view_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contract_id,
        invitation_no,
        invite_code,
        userId,
        invitee_name,
        invitee_phone,
        invitee_role,
        InvitationStatus.PENDING,
        expires_at,
        0,
        now,
        now
      ]
    );

    // 查询创建成功的邀请记录
    const newInvitations = await query<SignInvitationRow[]>(
      'SELECT * FROM sign_invitations WHERE id = ?',
      [result.insertId]
    );

    const invitation = newInvitations[0];

    res.status(201).json({
      code: 201,
      message: '签署邀请创建成功',
      data: toInvitationResponse(invitation)
    });
  } catch (error) {
    console.error('创建签署邀请错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * GET /api/invitations
 * 获取收到的签署邀请列表
 * 根据当前用户的手机号查询收到的签署邀请
 */
export const getReceivedInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        code: 401,
        message: '用户未认证'
      });
      return;
    }

    // 获取用户信息
    const users = await query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
      return;
    }

    const userPhone = users[0].phone;

    // 查询收到的签署邀请
    const invitations = await query<SignInvitationRow[]>(
      `SELECT si.*, c.title as contract_title, c.house_address
       FROM sign_invitations si
       LEFT JOIN contracts c ON si.contract_id = c.id
       WHERE si.invitee_phone = ?
       ORDER BY si.created_at DESC`,
      [userPhone]
    );

    // 检查并更新过期状态
    const now = new Date();
    const updatedInvitations = invitations.map(invitation => {
      if (invitation.status === InvitationStatus.PENDING && new Date(invitation.expires_at) < now) {
        return { ...invitation, status: InvitationStatus.EXPIRED };
      }
      return invitation;
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: updatedInvitations.map(toInvitationResponse)
    });
  } catch (error) {
    console.error('获取签署邀请列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * GET /api/invitations/:code
 * 通过邀请码获取合同信息
 * 乙方通过邀请链接访问时调用此接口
 */
export const getContractByInviteCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({
        code: 400,
        message: '邀请码不能为空'
      });
      return;
    }

    // 通过邀请码或邀请编号查询邀请记录
    let invitations = await query<SignInvitationRow[]>(
      'SELECT * FROM sign_invitations WHERE invite_code = ? OR invitation_no = ?',
      [code, code]
    );

    if (invitations.length === 0) {
      res.status(404).json({
        code: 404,
        message: '签署邀请不存在'
      });
      return;
    }

    const invitation = invitations[0];

    // 检查邀请是否过期
    if (invitation.status === InvitationStatus.PENDING && new Date(invitation.expires_at) < new Date()) {
      // 更新过期状态
      await execute(
        'UPDATE sign_invitations SET status = ?, updated_at = ? WHERE id = ?',
        [InvitationStatus.EXPIRED, new Date().toISOString(), invitation.id]
      );

      res.status(400).json({
        code: 400,
        message: '签署邀请已过期'
      });
      return;
    }

    // 检查邀请状态（允许 PENDING 和 ACCEPTED，因为扫码签署流程中接受后会变为 ACCEPTED）
    if (invitation.status !== InvitationStatus.PENDING && invitation.status !== InvitationStatus.ACCEPTED) {
      const statusMessages: Record<number, string> = {
        [InvitationStatus.ACCEPTED]: '签署邀请已被接受',
        [InvitationStatus.REFUSED]: '签署邀请已被拒绝',
        [InvitationStatus.EXPIRED]: '签署邀请已过期'
      };

      res.status(400).json({
        code: 400,
        message: statusMessages[invitation.status] || '签署邀请状态异常'
      });
      return;
    }

    // 更新查看次数和最后查看时间
    await execute(
      'UPDATE sign_invitations SET view_count = view_count + 1, last_viewed_at = ?, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), new Date().toISOString(), invitation.id]
    );

    // 查询合同详情
    const contracts = await query<RowDataPacket[]>(
      'SELECT * FROM contracts WHERE id = ?',
      [invitation.contract_id]
    );

    if (contracts.length === 0) {
      res.status(404).json({
        code: 404,
        message: '合同不存在'
      });
      return;
    }

    const contract = contracts[0];

    const response: IContractInfoResponse = {
      contract_id: contract.id,
      contract_no: contract.contract_no,
      title: contract.title,
      lessor_name: contract.lessor_name,
      lessor_phone: contract.lessor_phone,
      lessee_name: contract.lessee_name,
      lessee_phone: contract.lessee_phone,
      house_address: contract.house_address,
      house_area: contract.house_area,
      lease_start: contract.lease_start,
      lease_end: contract.lease_end,
      monthly_rent: contract.monthly_rent,
      payment_method: contract.payment_method,
      total_amount: contract.total_amount,
      deposit: contract.deposit,
      status: contract.status,
      effective_at: contract.effective_at,
      invitation_status: invitation.status,
      invitation_no: invitation.invitation_no,
      expires_at: invitation.expires_at
    };

    res.json({
      code: 200,
      message: '获取成功',
      data: response
    });
  } catch (error) {
    console.error('获取合同信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/invitations/:code/accept
 * 接受签署邀请（乙方）
 * 通过邀请码验证身份后接受邀请
 */
export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { invite_code } = req.body as IAcceptInvitation;

    if (!code || !invite_code) {
      res.status(400).json({
        code: 400,
        message: '邀请码不能为空'
      });
      return;
    }

    // 查询邀请记录（通过邀请码或邀请编号）
    let invitations = await query<SignInvitationRow[]>(
      'SELECT * FROM sign_invitations WHERE invite_code = ? OR invitation_no = ?',
      [code, code]
    );

    if (invitations.length === 0) {
      res.status(404).json({
        code: 404,
        message: '签署邀请不存在'
      });
      return;
    }

    const invitation = invitations[0];

    // 验证邀请码匹配
    if (invitation.invite_code !== invite_code && invitation.invitation_no !== code) {
      res.status(403).json({
        code: 403,
        message: '邀请码不匹配'
      });
      return;
    }

    // 检查邀请是否过期
    if (invitation.status === InvitationStatus.PENDING && new Date(invitation.expires_at) < new Date()) {
      await execute(
        'UPDATE sign_invitations SET status = ?, updated_at = ? WHERE id = ?',
        [InvitationStatus.EXPIRED, new Date().toISOString(), invitation.id]
      );

      res.status(400).json({
        code: 400,
        message: '签署邀请已过期'
      });
      return;
    }

    // 检查邀请状态
    if (invitation.status !== InvitationStatus.PENDING) {
      res.status(400).json({
        code: 400,
        message: '签署邀请状态不允许接受'
      });
      return;
    }

    // 更新邀请状态为已接受
    const now = new Date().toISOString();
    await execute(
      'UPDATE sign_invitations SET status = ?, accepted_at = ?, updated_at = ? WHERE id = ?',
      [InvitationStatus.ACCEPTED, now, now, invitation.id]
    );

    res.json({
      code: 200,
      message: '签署邀请已接受，请开始签署合同',
      data: {
        contract_id: invitation.contract_id,
        invitation_no: invitation.invitation_no,
        status: InvitationStatus.ACCEPTED,
        accepted_at: now
      }
    });
  } catch (error) {
    console.error('接受签署邀请错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/invitations/:code/reject
 * 拒绝签署邀请（乙方）
 */
export const rejectInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { invite_code, reason } = req.body as IRejectInvitation;

    if (!code || !invite_code) {
      res.status(400).json({
        code: 400,
        message: '邀请码不能为空'
      });
      return;
    }

    // 查询邀请记录（通过邀请码或邀请编号）
    let invitations = await query<SignInvitationRow[]>(
      'SELECT * FROM sign_invitations WHERE invite_code = ? OR invitation_no = ?',
      [code, code]
    );

    if (invitations.length === 0) {
      res.status(404).json({
        code: 404,
        message: '签署邀请不存在'
      });
      return;
    }

    const invitation = invitations[0];

    // 验证邀请码匹配
    if (invitation.invite_code !== invite_code && invitation.invitation_no !== code) {
      res.status(403).json({
        code: 403,
        message: '邀请码不匹配'
      });
      return;
    }

    // 检查邀请状态
    if (invitation.status !== InvitationStatus.PENDING) {
      res.status(400).json({
        code: 400,
        message: '签署邀请状态不允许拒绝'
      });
      return;
    }

    // 更新邀请状态为已拒绝
    const now = new Date().toISOString();
    await execute(
      'UPDATE sign_invitations SET status = ?, refused_reason = ?, updated_at = ? WHERE id = ?',
      [InvitationStatus.REFUSED, reason || null, now, invitation.id]
    );

    res.json({
      code: 200,
      message: '签署邀请已拒绝',
      data: {
        invitation_no: invitation.invitation_no,
        status: InvitationStatus.REFUSED,
        refused_reason: reason
      }
    });
  } catch (error) {
    console.error('拒绝签署邀请错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/notifications/send-sign-invite
 * 发送签署邀请通知（模拟）
 * 创建签署邀请后调用此接口向乙方发送通知
 */
export const sendSignInviteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invitation_no, invitee_phone, invitee_name, contract_title, invite_code } = req.body;

    if (!invitation_no || !invitee_phone) {
      res.status(400).json({
        code: 400,
        message: '邀请编号和被邀请人手机号不能为空'
      });
      return;
    }

    // 模拟发送通知（实际应调用短信、邮件等通知服务）
    // 这里模拟发送短信通知
    const inviteLink = `https://example.com/sign?code=${invite_code || invitation_no}`;
    const message = `【租赁合同】尊敬的${invitee_name || '用户'}，您收到一份来自身份宝的合同签署邀请："${contract_title || '租赁合同'}"。请在有效期内点击链接签署：${inviteLink}`;

    // 模拟发送延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    // 记录发送日志
    console.log(`[模拟短信通知] 向 ${invitee_phone} 发送签署邀请通知:`);
    console.log(`  邀请编号: ${invitation_no}`);
    console.log(`  签署链接: ${inviteLink}`);
    console.log(`  短信内容: ${message}`);

    const response: INotificationResponse = {
      success: true,
      message: '通知发送成功',
      notification_type: 'sign_invite',
      recipient: invitee_phone,
      sent_at: new Date()
    };

    res.json({
      code: 200,
      message: '通知发送成功',
      data: response
    });
  } catch (error) {
    console.error('发送签署邀请通知错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/notifications/send-sign-complete
 * 发送签署完成通知（模拟）
 * 合同签署完成后调用此接口向甲方发送通知
 */
export const sendSignCompleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contract_id, invitee_phone, invitee_name, contract_title, contract_no } = req.body;

    if (!contract_id || !invitee_phone) {
      res.status(400).json({
        code: 400,
        message: '合同ID和被邀请人手机号不能为空'
      });
      return;
    }

    // 模拟发送通知
    const message = `【租赁合同】尊敬的${invitee_name || '用户'}，您发出的合同"${contract_title || '租赁合同'}"（编号：${contract_no || ''}）已签署完成，双方确认后合同正式生效。`;

    // 模拟发送延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    // 记录发送日志
    console.log(`[模拟短信通知] 向 ${invitee_phone} 发送签署完成通知:`);
    console.log(`  合同ID: ${contract_id}`);
    console.log(`  合同编号: ${contract_no}`);
    console.log(`  短信内容: ${message}`);

    const response: INotificationResponse = {
      success: true,
      message: '通知发送成功',
      notification_type: 'sign_complete',
      recipient: invitee_phone,
      sent_at: new Date()
    };

    res.json({
      code: 200,
      message: '通知发送成功',
      data: response
    });
  } catch (error) {
    console.error('发送签署完成通知错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};
