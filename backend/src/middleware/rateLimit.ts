import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

const requestMap = new Map<string, RequestRecord>();

function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of requestMap.entries()) {
    if (now > record.resetTime) {
      requestMap.delete(key);
    }
  }
}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = '请求过于频繁，请稍后再试' } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = requestMap.get(ip);

    if (!record || now > record.resetTime) {
      requestMap.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    record.count++;

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        code: 429,
        message,
        data: null
      });
      return;
    }

    next();
  };
}

setInterval(cleanupExpiredRecords, 60000);
