import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { Request } from 'express';

dotenv.config({ path: '../config/.env' });

// 从环境变量读取允许的来源
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  // 默认允许的来源
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ];
};

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    
    // 开发环境下允许所有来源
    if (process.env.NODE_ENV === 'development' || !origin) {
      console.log(`[CORS] 允许开发环境请求来源: ${origin || '无origin'}`);
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`[CORS] 允许请求来源: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`[CORS] 拒绝请求来源: ${origin}`);
      callback(new Error('不允许的请求来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token' // 添加对CSRF令牌的支持
  ],
  exposedHeaders: [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'X-CSRF-Token' // 暴露CSRF令牌头部
  ],
  maxAge: 86400, // 24小时
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// 自定义CORS中间件，添加日志记录
const customCorsMiddleware = (req: Request, res: any, next: any) => {
  // 记录CORS请求
  if (req.method === 'OPTIONS') {
    console.log(`[CORS] 处理预检请求: ${req.method} ${req.path}`);
  }
  
  // 使用cors中间件
  return cors(corsOptions)(req, res, next);
};

export const corsMiddleware = customCorsMiddleware;

export default corsMiddleware;