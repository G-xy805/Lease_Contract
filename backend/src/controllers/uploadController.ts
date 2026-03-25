import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { pdfService } from '../services/pdfService';

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

    // 验证文件类型
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(req.file.mimetype)) {
      // 删除已上传的文件
      fs.unlinkSync(req.file.path);
      res.status(400).json({
        code: 400,
        message: '只支持 JPG、PNG、GIF、WebP 格式的图片'
      });
      return;
    }

    // 验证文件大小 (最大 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({
        code: 400,
        message: '图片大小不能超过 5MB'
      });
      return;
    }

    // 生成访问URL
    const fileUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      code: 200,
      message: '图片上传成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
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

    // 验证文件大小 (最大 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({
        code: 400,
        message: '文件大小不能超过 50MB'
      });
      return;
    }

    // 生成访问URL
    const fileUrl = `/uploads/files/${req.file.filename}`;

    res.json({
      code: 200,
      message: '文件上传成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// 生成合同PDF
export const generateContractPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        code: 400,
        message: '合同ID不能为空'
      });
      return;
    }

    // 这里应该从数据库获取合同数据
    // 模拟合同数据，实际项目中应从数据库查询
    const contractData = {
      id: id,
      contractNumber: `HT-${Date.now()}`,
      title: '房屋租赁合同',
      partyA: {
        name: '甲方（出租方）',
        company: '示例房产公司',
        contact: '张三',
        phone: '13800138000',
        address: '北京市朝阳区示例地址'
      },
      partyB: {
        name: '乙方（承租方）',
        company: '',
        contact: '李四',
        phone: '13900139000',
        address: '北京市海淀区示例地址'
      },
      property: {
        address: '北京市朝阳区某小区某栋某单元某号',
        area: '90平方米',
        roomType: '两室一厅',
        orientation: '南北通透'
      },
      rent: {
        amount: 5000,
        paymentCycle: '月付',
        deposit: 10000,
        paymentDate: '每月5日前'
      },
      duration: {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        totalMonths: 12
      },
      terms: [
        '租赁期内，甲方不得擅自收回房屋；',
        '乙方应按约定时间支付租金，逾期按日加收0.5%的滞纳金；',
        '乙方应合理使用房屋设施，不得擅自改装或破坏；',
        '租赁期满，乙方应按时交还房屋，甲方退还押金（无损坏情况下）；',
        '双方如需提前解除合同，应提前30天书面通知对方；',
        '本合同未尽事宜，双方可协商补充，补充协议与本合同具有同等法律效力。'
      ],
      createdAt: new Date().toISOString()
    };

    // 生成PDF
    const pdfResult = await pdfService.generateContractPdf(contractData);

    if (!pdfResult.success) {
      res.status(500).json({
        code: 500,
        message: 'PDF生成失败',
        error: pdfResult.error
      });
      return;
    }

    // 设置响应头，直接返回PDF文件
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contract_${id}.pdf`);
    res.sendFile(pdfResult.filePath, (err) => {
      if (err) {
        console.error('PDF发送失败:', err);
        if (!res.headersSent) {
          res.status(500).json({
            code: 500,
            message: 'PDF发送失败'
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
