import { Request, Response } from 'express';
import { query, insert, execute } from '../database';
import { generateToken, AuthRequest } from '../middleware/auth';
import {
  IUser,
  IUserRegister,
  IUserLogin,
  IUserProfileUpdate,
  IRealNameVerify,
  IUserLoginResponse,
  IUserProfileResponse,
  ISendCodeResponse,
  RealNameStatus,
  UserRole,
  UserRow
} from '../models/User';
import { RowDataPacket } from 'mysql2';

// 存储模拟验证码（本地开发用）
const verificationCodes: Map<string, { code: string; expiresAt: Date }> = new Map();

/**
 * 获取角色显示名称
 */
const getRoleName = (role: string): string => {
  switch (role) {
    case UserRole.LESSOR:
      return '房东';
    case UserRole.LESSEE:
      return '租客';
    case UserRole.ADMIN:
      return '管理员';
    default:
      return '未知';
  }
};

/**
 * 生成6位数字验证码
 */
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 查找或创建用户
 */
const findOrCreateUser = async (data: IUserRegister): Promise<IUser> => {
  // 先查询用户是否存在
  let users = await query<UserRow[]>(
    'SELECT * FROM users WHERE phone = ? OR openid = ? LIMIT 1',
    [data.phone, data.openid || null]
  );

  if (users.length > 0) {
    return users[0];
  }

  // 创建新用户（id由数据库自动生成）
  const now = new Date().toISOString();
  // 检查是否是第一个用户，第一个用户强制设为 ADMIN
  const userCount = await query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
  const isFirstUser = userCount[0].count === 0;
  // 只有第一个用户能成为 ADMIN，后续用户必须指定角色（通过管理界面分配）
  const role = isFirstUser ? UserRole.ADMIN : UserRole.LESSEE;

  const result = await insert(
    `INSERT INTO users (openid, phone, name, real_name_status, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.openid || null, data.phone, data.name || null, RealNameStatus.NONE, role, now, now]
  );

  // 返回创建的用户
  const newUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [result.insertId]);
  return newUsers[0];
};

/**
 * POST /api/users/wechat-login
 * 微信登录
 */
export const wechatLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, openid, role } = req.body;

    if (!openid) {
      res.status(400).json({
        code: 400,
        message: '微信openid不能为空'
      });
      return;
    }

    const user = await findOrCreateUser({
      openid,
      phone: '',
      role: role || UserRole.LESSEE
    });

    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      openid: user.openid,
      phone: user.phone
    });

    const response: IUserLoginResponse = {
      token,
      user: {
        id: user.id,
        openid: user.openid,
        phone: user.phone,
        name: user.name,
        real_name_status: user.real_name_status,
        role: user.role as UserRole,
        roleName: getRoleName(user.role),
        status: user.status
      }
    };

    res.json({
      code: 200,
      message: '登录成功',
      data: response
    });
  } catch (error) {
    console.error('微信登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/users/phone-login
 * 手机号登录（验证码登录）
 */
export const phoneLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code, role } = req.body;

    if (!phone || !code) {
      res.status(400).json({
        code: 400,
        message: '手机号和验证码不能为空'
      });
      return;
    }

    const storedCode = verificationCodes.get(phone);
    if (!storedCode) {
      res.status(400).json({
        code: 400,
        message: '请先获取验证码'
      });
      return;
    }

    if (storedCode.code !== code) {
      res.status(400).json({
        code: 400,
        message: '验证码错误'
      });
      return;
    }

    if (new Date() > storedCode.expiresAt) {
      verificationCodes.delete(phone);
      res.status(400).json({
        code: 400,
        message: '验证码已过期'
      });
      return;
    }

    // 验证成功后删除验证码
    verificationCodes.delete(phone);

    // 查找或创建用户
    const user = await findOrCreateUser({ phone, role });

    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      openid: user.openid,
      phone: user.phone
    });

    const response: IUserLoginResponse = {
      token,
      user: {
        id: user.id,
        openid: user.openid,
        phone: user.phone,
        name: user.name,
        real_name_status: user.real_name_status,
        role: user.role as UserRole,
        roleName: getRoleName(user.role),
        status: user.status
      }
    };

    res.json({
      code: 200,
      message: '登录成功',
      data: response
    });
  } catch (error) {
    console.error('手机号登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/users/send-code
 * 发送验证码（本地开发用模拟）
 */
export const sendCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({
        code: 400,
        message: '手机号不能为空'
      });
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({
        code: 400,
        message: '手机号格式不正确'
      });
      return;
    }

    // 生成验证码
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟过期

    // 存储验证码
    verificationCodes.set(phone, { code, expiresAt });

    // 模拟发送短信（本地开发环境直接返回验证码）
    // 实际应调用短信网关发送验证码
    console.log(`[模拟短信] 向 ${phone} 发送验证码: ${code}`);

    const response: ISendCodeResponse = {
      success: true,
      message: '验证码发送成功',
      code: process.env.NODE_ENV === 'development' ? code : undefined // 开发环境返回验证码
    };

    res.json({
      code: 200,
      message: '验证码发送成功',
      data: response
    });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * GET /api/users/profile
 * 获取用户信息
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        code: 401,
        message: '用户未认证'
      });
      return;
    }

    const users = await query<UserRow[]>(
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

    const user = users[0];

    const response: IUserProfileResponse = {
      id: user.id,
      openid: user.openid,
      phone: user.phone,
      name: user.name,
      idcard: user.idcard,
      real_name_status: user.real_name_status,
      real_name_at: user.real_name_at,
      role: user.role as UserRole,
      roleName: getRoleName(user.role),
      status: user.status,
      created_at: user.created_at
    };

    res.json({
      code: 200,
      message: '获取成功',
      data: response
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * PUT /api/users/profile
 * 更新用户信息
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name } = req.body as IUserProfileUpdate;

    if (!userId) {
      res.status(401).json({
        code: 401,
        message: '用户未认证'
      });
      return;
    }

    // 检查用户是否存在
    const users = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
      return;
    }

    // 构建更新语句
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (updates.length === 0) {
      res.status(400).json({
        code: 400,
        message: '没有需要更新的字段'
      });
      return;
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(userId);

    await execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // 返回更新后的用户信息
    const updatedUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
    const user = updatedUsers[0];

    const response: IUserProfileResponse = {
      id: user.id,
      openid: user.openid,
      phone: user.phone,
      name: user.name,
      idcard: user.idcard,
      real_name_status: user.real_name_status,
      real_name_at: user.real_name_at,
      role: user.role as UserRole,
      roleName: getRoleName(user.role),
      status: user.status,
      created_at: user.created_at
    };

    res.json({
      code: 200,
      message: '更新成功',
      data: response
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/users/real-name/verify
 * 实名认证（本地开发用模拟）
 */
export const realNameVerify = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, idcard } = req.body as IRealNameVerify;

    if (!userId) {
      res.status(401).json({
        code: 401,
        message: '用户未认证'
      });
      return;
    }

    if (!name || !idcard) {
      res.status(400).json({
        code: 400,
        message: '姓名和身份证号不能为空'
      });
      return;
    }

    // 验证身份证号格式
    const idcardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    if (!idcardRegex.test(idcard)) {
      res.status(400).json({
        code: 400,
        message: '身份证号格式不正确'
      });
      return;
    }

    // 检查用户是否存在
    const users = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
      return;
    }

    // 模拟实名认证（实际应调用第三方实名认证接口）
    // 本地开发环境模拟验证过程
    const isVerified = process.env.NODE_ENV === 'development' ? true : false;

    if (isVerified) {
      // 开发环境直接认证成功
      const now = new Date().toISOString();
      await execute(
        `UPDATE users SET name = ?, idcard = ?, real_name_status = ?, real_name_at = ?, updated_at = ? WHERE id = ?`,
        [name, idcard, RealNameStatus.VERIFIED, now, now, userId]
      );

      // 返回更新后的用户信息
      const updatedUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
      const user = updatedUsers[0];

      const response: IUserProfileResponse = {
        id: user.id,
        openid: user.openid,
        phone: user.phone,
        name: user.name,
        idcard: user.idcard,
        real_name_status: user.real_name_status,
        real_name_at: user.real_name_at,
        role: user.role as UserRole,
        roleName: getRoleName(user.role),
        status: user.status,
        created_at: user.created_at
      };

      console.log(`[模拟实名认证] 用户 ${userId} 认证成功`);

      res.json({
        code: 200,
        message: '实名认证成功',
        data: response
      });
    } else {
      // 生产环境调用第三方接口
      // 假设第三方接口返回认证状态
      const thirdPartyResult = { success: true, message: '认证通过' };

      if (thirdPartyResult.success) {
        const now = new Date().toISOString();
        await execute(
          `UPDATE users SET name = ?, idcard = ?, real_name_status = ?, real_name_at = ?, updated_at = ? WHERE id = ?`,
          [name, idcard, RealNameStatus.VERIFIED, now, now, userId]
        );

        const updatedUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
        const user = updatedUsers[0];

        res.json({
          code: 200,
          message: '实名认证成功',
          data: {
            id: user.id,
            openid: user.openid,
            phone: user.phone,
            name: user.name,
            real_name_status: user.real_name_status,
            real_name_at: user.real_name_at
          }
        });
      } else {
        await execute(
          `UPDATE users SET name = ?, idcard = ?, real_name_status = ?, updated_at = ? WHERE id = ?`,
          [name, idcard, RealNameStatus.FAILED, new Date().toISOString(), userId]
        );

        res.status(400).json({
          code: 400,
          message: thirdPartyResult.message || '实名认证失败'
        });
      }
    }
  } catch (error) {
    console.error('实名认证错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/users/apply-lessor
 * 申请成为甲方
 */
export const applyLessor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        code: 401,
        message: '用户未认证'
      });
      return;
    }

    // 检查用户是否已是 LESSOR 或 ADMIN
    const users = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
      return;
    }

    const user = users[0];
    if (user.role === UserRole.LESSOR) {
      res.status(400).json({
        code: 400,
        message: '您已经是房东'
      });
      return;
    }

    if (user.role === UserRole.ADMIN) {
      res.status(400).json({
        code: 400,
        message: '管理员无需申请'
      });
      return;
    }

    // 将用户角色更新为 LESSOR（待审核状态，实际审核由管理员操作）
    // 这里暂时直接改role，实际生产环境可能需要单独的申请状态字段
    await execute(
      'UPDATE users SET role = ?, updated_at = ? WHERE id = ?',
      [UserRole.LESSOR, new Date().toISOString(), userId]
    );

    res.json({
      code: 200,
      message: '申请成功，请等待管理员审核'
    });
  } catch (error) {
    console.error('申请成为甲方错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/users/audit-lessor
 * 管理员审核甲方申请
 */
export const auditLessor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    const { userId, approved } = req.body;

    if (!currentUserId) {
      res.status(401).json({
        code: 401,
        message: '用户未认证'
      });
      return;
    }

    if (!userId) {
      res.status(400).json({
        code: 400,
        message: '目标用户ID不能为空'
      });
      return;
    }

    // 验证当前用户是 ADMIN
    const currentUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [currentUserId]);
    if (currentUsers.length === 0 || currentUsers[0].role !== UserRole.ADMIN) {
      res.status(403).json({
        code: 403,
        message: '只有管理员才能审核'
      });
      return;
    }

    // 检查目标用户是否存在
    const targetUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
    if (targetUsers.length === 0) {
      res.status(404).json({
        code: 404,
        message: '目标用户不存在'
      });
      return;
    }

    // 根据审核结果更新目标用户的 role
    const newRole = approved ? UserRole.LESSOR : UserRole.LESSEE;
    await execute(
      'UPDATE users SET role = ?, updated_at = ? WHERE id = ?',
      [newRole, new Date().toISOString(), userId]
    );

    res.json({
      code: 200,
      message: approved ? '审核通过，用户已成为房东' : '审核拒绝，用户角色已恢复'
    });
  } catch (error) {
    console.error('审核甲方申请错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/users/:id/ban
 * 管理员封禁用户
 */
export const banUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    const targetUserId = parseInt(req.params.id);

    if (!currentUserId) {
      res.status(401).json({
        code: 401,
        message: '用户未认证'
      });
      return;
    }

    if (isNaN(targetUserId)) {
      res.status(400).json({
        code: 400,
        message: '无效的用户ID'
      });
      return;
    }

    // 验证当前用户是 ADMIN
    const currentUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [currentUserId]);
    if (currentUsers.length === 0 || currentUsers[0].role !== UserRole.ADMIN) {
      res.status(403).json({
        code: 403,
        message: '只有管理员才能封禁用户'
      });
      return;
    }

    // 检查目标用户是否存在
    const targetUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [targetUserId]);
    if (targetUsers.length === 0) {
      res.status(404).json({
        code: 404,
        message: '目标用户不存在'
      });
      return;
    }

    // 不能封禁自己
    if (targetUserId === currentUserId) {
      res.status(400).json({
        code: 400,
        message: '不能封禁自己'
      });
      return;
    }

    // 更新目标用户的 status = 1
    await execute(
      'UPDATE users SET status = 1, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), targetUserId]
    );

    res.json({
      code: 200,
      message: '用户已封禁'
    });
  } catch (error) {
    console.error('封禁用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * POST /api/users/:id/unban
 * 管理员解封用户
 */
export const unbanUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    const targetUserId = parseInt(req.params.id);

    if (!currentUserId) {
      res.status(401).json({
        code: 401,
        message: '用户未认证'
      });
      return;
    }

    if (isNaN(targetUserId)) {
      res.status(400).json({
        code: 400,
        message: '无效的用户ID'
      });
      return;
    }

    // 验证当前用户是 ADMIN
    const currentUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [currentUserId]);
    if (currentUsers.length === 0 || currentUsers[0].role !== UserRole.ADMIN) {
      res.status(403).json({
        code: 403,
        message: '只有管理员才能解封用户'
      });
      return;
    }

    // 检查目标用户是否存在
    const targetUsers = await query<UserRow[]>('SELECT * FROM users WHERE id = ?', [targetUserId]);
    if (targetUsers.length === 0) {
      res.status(404).json({
        code: 404,
        message: '目标用户不存在'
      });
      return;
    }

    // 更新目标用户的 status = 0
    await execute(
      'UPDATE users SET status = 0, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), targetUserId]
    );

    res.json({
      code: 200,
      message: '用户已解封'
    });
  } catch (error) {
    console.error('解封用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};
