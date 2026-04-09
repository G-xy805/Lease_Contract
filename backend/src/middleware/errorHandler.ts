import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  type?: string;
  details?: any;
}

// 错误类型枚举
enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  BUSINESS = 'BUSINESS',
  INTERNAL = 'INTERNAL'
}

// 错误状态码映射
const ERROR_STATUS_CODES = {
  [ErrorType.VALIDATION]: 400,
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.DATABASE]: 500,
  [ErrorType.NETWORK]: 503,
  [ErrorType.BUSINESS]: 409,
  [ErrorType.INTERNAL]: 500
};

// 错误消息映射
const ERROR_MESSAGES = {
  [ErrorType.VALIDATION]: '数据验证失败',
  [ErrorType.AUTHENTICATION]: '认证失败',
  [ErrorType.AUTHORIZATION]: '权限不足',
  [ErrorType.DATABASE]: '数据库操作失败',
  [ErrorType.NETWORK]: '网络连接失败',
  [ErrorType.BUSINESS]: '业务逻辑错误',
  [ErrorType.INTERNAL]: '服务器内部错误'
};

/**
 * 错误处理中间件
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 确定错误类型
  const errorType = err.type || ErrorType.INTERNAL;
  
  // 确定状态码
  const statusCode = err.statusCode || ERROR_STATUS_CODES[errorType];
  
  // 确定错误码
  const errorCode = err.code || statusCode;
  
  // 确定错误消息
  const message = isDevelopment ? err.message : ERROR_MESSAGES[errorType];
  
  // 构建错误日志
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      type: errorType,
      message: err.message,
      code: errorCode,
      statusCode: statusCode,
      details: err.details,
      stack: isDevelopment ? err.stack : undefined
    }
  };
  
  // 记录错误日志
  console.error('[Error]', JSON.stringify(errorLog, null, 2));
  
  // 返回错误响应
  res.status(statusCode).json({
    code: errorCode,
    message,
    data: null,
    ...(isDevelopment && { details: err.details })
  });
}

/**
 * 创建自定义错误
 */
export function createError(
  type: ErrorType,
  message: string,
  details?: any,
  code?: number
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.statusCode = ERROR_STATUS_CODES[type];
  error.code = code || ERROR_STATUS_CODES[type];
  error.details = details;
  return error;
}

/**
 * 验证错误
 */
export function createValidationError(message: string, details?: any): AppError {
  return createError(ErrorType.VALIDATION, message, details);
}

/**
 * 认证错误
 */
export function createAuthError(message: string = '认证失败'): AppError {
  return createError(ErrorType.AUTHENTICATION, message);
}

/**
 * 授权错误
 */
export function createAuthorizationError(message: string = '权限不足'): AppError {
  return createError(ErrorType.AUTHORIZATION, message);
}

/**
 * 数据库错误
 */
export function createDatabaseError(message: string, details?: any): AppError {
  return createError(ErrorType.DATABASE, message, details);
}

/**
 * 业务错误
 */
export function createBusinessError(message: string, details?: any): AppError {
  return createError(ErrorType.BUSINESS, message, details);
}

/**
 * 内部错误
 */
export function createInternalError(message: string = '服务器内部错误'): AppError {
  return createError(ErrorType.INTERNAL, message);
}
