import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage, uploadFile } from '../controllers/uploadController';

const router = Router();

// 配置文件存储
const createStorage = (subDir: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', subDir);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${uuidv4()}${ext}`;
      cb(null, uniqueName);
    }
  });
};

// 文件过滤器
const imageFilter = (req: any, file: any, cb: any) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'), false);
  }
};

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 配置 multer
const imageUpload = multer({
  storage: createStorage('images'),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: imageFilter
});

const fileUpload = multer({
  storage: createStorage('files'),
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: fileFilter
});

// 错误处理中间件
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    return res.status(400).json({
      code: 400,
      message: err.message
    });
  }
  next();
};

// 确保上传目录存在
import fs from 'fs';
const ensureUploadDirs = () => {
  const dirs = ['uploads/images', 'uploads/files'];
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};
ensureUploadDirs();

/**
 * @route POST /api/upload/image
 * @desc 图片上传接口
 * @access public
 */
router.post('/image', imageUpload.single('file') as any, handleMulterError, uploadImage as any);

/**
 * @route POST /api/upload/file
 * @desc 文件上传接口
 * @access public
 */
router.post('/file', fileUpload.single('file') as any, handleMulterError, uploadFile as any);

export default router;
