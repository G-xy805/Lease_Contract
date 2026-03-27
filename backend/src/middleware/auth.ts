import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '../config/.env' });

export interface JwtPayload {
  userId: number;
  openid: string | null;
  phone: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  const expiresIn = '7d';
  return jwt.sign(payload as object, secret, { expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.verify(token, secret) as JwtPayload;
};

// JWT认证中间件
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ code: 401, message: '未提供认证令牌' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ code: 401, message: '令牌格式无效' });
      return;
    }

    const token = parts[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ code: 401, message: '令牌已过期' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ code: 401, message: '令牌无效' });
      return;
    }
    res.status(500).json({ code: 500, message: '认证失败' });
  }
};

// 可选认证中间件（不强制要求登录）
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = verifyToken(token);
        req.user = decoded;
      }
    }
  } catch (error) {
    // 忽略错误，继续处理
  }
  next();
};