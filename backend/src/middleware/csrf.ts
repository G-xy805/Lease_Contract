import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = '_csrfToken';
const TOKEN_LENGTH = 32;

interface CsrfRequest extends Request {
  csrfToken?: string;
}

function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

export function csrfProtection(req: CsrfRequest, res: Response, next: NextFunction): void {
  const token = req.headers[CSRF_TOKEN_HEADER.toLowerCase()] as string || req.body?._csrf;

  if (!token) {
    res.status(403).json({
      code: 403,
      message: '缺少CSRF Token'
    });
    return;
  }

  const sessionToken = req.headers.cookie?.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`))?.[1];

  if (!sessionToken || token !== sessionToken) {
    res.status(403).json({
      code: 403,
      message: 'CSRF Token验证失败'
    });
    return;
  }

  next();
}

export function generateCsrfToken(req: CsrfRequest, res: Response, next: NextFunction): void {
  const token = generateToken();
  req.csrfToken = token;
  res.setHeader('X-CSRF-Token', token);
  res.setHeader('Set-Cookie', `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict`);
  next();
}
