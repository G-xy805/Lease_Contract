import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import { testConnection } from './database';
import { authMiddleware } from './middleware/auth';
import corsMiddleware from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import uploadRoutes from './routes/upload';
import usersRouter from './routes/users';
import templatesRouter from './routes/templates';
import contractsRouter from './routes/contracts';
import invitationsRouter from './routes/invitations';
import notificationsRouter from './routes/notifications';
import signaturesRouter from './routes/signatures';
import testDataRouter from './routes/testData';

dotenv.config({ path: './config/.env' });

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(corsMiddleware);

// 静态文件服务 - 托管 uploads 目录
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
  console.log(`API v1 请求: ${req.method} ${req.path}`);
  next();
});

app.use('/api/users', usersRouter);
app.use('/api/templates', templatesRouter);

// 二维码生成服务 - 使用外部API生成二维码图片
// 注意：这个路由必须放在 contractsRouter 之前，否则 /api/contracts/:id 会先匹配 invite-qrcode 作为 id
app.get('/api/contracts/invite-qrcode/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/sign/${code}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

    https.get(qrApiUrl, (qrRes) => {
      if (qrRes.statusCode === 200) {
        res.setHeader('Content-Type', 'image/png');
        qrRes.pipe(res);
      } else {
        res.status(qrRes.statusCode || 500).json({ code: 500, message: '生成二维码失败' });
      }
    }).on('error', (err) => {
      console.error('获取二维码错误:', err);
      res.status(500).json({ code: 500, message: '生成二维码失败' });
    });
  } catch (error) {
    console.error('生成二维码错误:', error);
    res.status(500).json({ code: 500, message: '生成二维码失败' });
  }
});

app.use('/api/contracts', contractsRouter);
app.use('/api/upload', uploadRoutes);
app.use('/api/invitations', invitationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/signatures', signaturesRouter);
app.use('/api/test-data', testDataRouter);

// 二维码生成服务 - 使用外部API生成二维码图片
app.get('/api/contracts/invite-qrcode/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/sign/${code}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

    https.get(qrApiUrl, (qrRes) => {
      if (qrRes.statusCode === 200) {
        res.setHeader('Content-Type', 'image/png');
        qrRes.pipe(res);
      } else {
        res.status(qrRes.statusCode || 500).json({ code: 500, message: '生成二维码失败' });
      }
    }).on('error', (err) => {
      console.error('获取二维码错误:', err);
      res.status(500).json({ code: 500, message: '生成二维码失败' });
    });
  } catch (error) {
    console.error('生成二维码错误:', error);
    res.status(500).json({ code: 500, message: '生成二维码失败' });
  }
});

app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  });
});

const startServer = async (): Promise<void> => {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
