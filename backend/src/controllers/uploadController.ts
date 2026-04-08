import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 扩展Request类型以包含上传文件
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

// 图片上传
export const uploadImage = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        code: 400,
        message: '请选择要上传的图片文件'
      });
      return;
    }

    if (req.file.size > MAX_FILE_SIZE || !ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({
        code: 400,
        message: '不支持的文件类型或文件过大（最大5MB）'
      });
      return;
    }

    const fileExt = path.extname(req.file.originalname);
    const newFileName = `${uuidv4()}${fileExt}`;
    const newFilePath = path.join(path.dirname(req.file.path), newFileName);

    fs.renameSync(req.file.path, newFilePath);

    res.json({
      code: 200,
      message: '图片上传成功',
      data: {
        filename: newFileName,
        url: `/uploads/images/${newFileName}`,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    next(error);
  }
};

// 文件上传
export const uploadFile = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        code: 400,
        message: '请选择要上传的文件'
      });
      return;
    }

    if (req.file.size > MAX_FILE_SIZE) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({
        code: 400,
        message: '不支持的文件类型或文件过大（最大5MB）'
      });
      return;
    }

    const fileExt = path.extname(req.file.originalname);
    const newFileName = `${uuidv4()}${fileExt}`;
    const newFilePath = path.join(path.dirname(req.file.path), newFileName);

    fs.renameSync(req.file.path, newFilePath);

    res.json({
      code: 200,
      message: '文件上传成功',
      data: {
        filename: newFileName,
        url: `/uploads/files/${newFileName}`,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    next(error);
  }
};
