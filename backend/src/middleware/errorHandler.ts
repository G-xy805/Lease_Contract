import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  if (isDevelopment && err.stack) {
    console.error('[Stack]:', err.stack);
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || statusCode;
  const message = isDevelopment ? err.message : '服务器内部错误';

  res.status(statusCode).json({
    code: errorCode,
    message,
    data: null
  });
}
