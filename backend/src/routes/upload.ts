import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage, uploadFile, generateContractPdf } from '../controllers/uploadController';

const router = Router();

// 配置文件存储
const createStorage = (subDir: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', subDir);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // 生成唯一文件名，保留原始扩展名
      const ext = path.extname(file.originalname);
      const uniqueName = `${uuidv4()}${ext}`;
      cb(null, uniqueName);
    }
  });
};

// 文件过滤器
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'), false);
  }
};

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFilter
});

const fileUpload = multer({
  storage: createStorage('files'),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: fileFilter
});

// 错误处理中间件
const handleMulterError = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '文件大小超过限制'
      });
    }
    return res.status(400).json({
      code: 400,
      message: err.message
    });
  } else if (err) {
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
  const dirs = ['uploads/images', 'uploads/files', 'uploads/pdfs'];
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
router.post('/image', imageUpload.single('file'), handleMulterError, uploadImage);

/**
 * @route POST /api/upload/file
 * @desc 文件上传接口
 * @access public
 */
router.post('/file', fileUpload.single('file'), handleMulterError, uploadFile);

/**
 * @route GET /api/contracts/:id/pdf
 * @desc 生成合同PDF接口
 * @access public
 */
router.get('/contracts/:id/pdf', generateContractPdf);

export default router;
