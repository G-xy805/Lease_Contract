import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request, res: Response, options: any) => void;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  route?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
  route?: string;
}

const requestMap = new Map<string, RequestRecord>();

function cleanupExpiredRecords(): void {
  const now = Date.now();
  let deleted = 0;
  for (const [key, record] of requestMap.entries()) {
    if (now > record.resetTime) {
      requestMap.delete(key);
      deleted++;
    }
  }
  if (deleted > 0) {
    console.log(`[RateLimit] 清理了 ${deleted} 条过期记录`);
  }
}

/**
 * API请求频率限制中间件
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = '请求过于频繁，请稍后再试',
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown',
    skip = (req: Request) => false,
    handler = (req: Request, res: Response, options: any) => {
      const retryAfter = Math.ceil((options.resetTime - Date.now()) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        code: 429,
        message: options.message,
        data: null
      });
    },
    standardHeaders = true,
    legacyHeaders = true,
    route = '*'
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    // 检查是否跳过限制
    if (skip(req)) {
      next();
      return;
    }

    // 生成限流键
    const key = keyGenerator(req);
    const now = Date.now();
    const record = requestMap.get(key);

    if (!record || now > record.resetTime) {
      // 创建新记录
      requestMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
        route
      });
      
      // 设置响应头
      if (standardHeaders) {
        res.set('X-RateLimit-Limit', String(maxRequests));
        res.set('X-RateLimit-Remaining', String(maxRequests - 1));
        res.set('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
      }
      
      if (legacyHeaders) {
        res.set('X-RateLimit-Limit', String(maxRequests));
        res.set('X-RateLimit-Remaining', String(maxRequests - 1));
      }
      
      console.log(`[RateLimit] 新请求 - IP: ${key}, 路由: ${route}, 剩余次数: ${maxRequests - 1}`);
      next();
      return;
    }

    // 更新记录
    record.count++;
    const remaining = maxRequests - record.count;
    
    // 设置响应头
    if (standardHeaders) {
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
      res.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
    }
    
    if (legacyHeaders) {
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
    }

    // 检查是否超过限制
    if (record.count > maxRequests) {
      console.warn(`[RateLimit] 请求被拒绝 - IP: ${key}, 路由: ${route}, 超过限制: ${record.count}/${maxRequests}`);
      handler(req, res, {
        message,
        resetTime: record.resetTime,
        maxRequests,
        current: record.count
      });
      return;
    }

    console.log(`[RateLimit] 请求通过 - IP: ${key}, 路由: ${route}, 剩余次数: ${remaining}`);
    next();
  };
}

/**
 * 基于路由的速率限制
 */
export function routeRateLimit(config: RateLimitConfig & { route: string }) {
  return rateLimit({
    ...config,
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return `${ip}:${config.route}`;
    }
  });
}

/**
 * 全局速率限制
 */
export function globalRateLimit(config: RateLimitConfig) {
  return rateLimit({
    ...config,
    route: 'global'
  });
}

/**
 * 登录相关接口速率限制
 */
export function loginRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 5, // 最多5次请求
    message: '登录请求过于频繁，请60秒后再试',
    route: 'login'
  });
}

/**
 * 验证码相关接口速率限制
 */
export function codeRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 3, // 最多3次请求
    message: '发送验证码过于频繁，请60秒后再试',
    route: 'code'
  });
}

// 每60秒清理一次过期记录
setInterval(cleanupExpiredRecords, 60000);
