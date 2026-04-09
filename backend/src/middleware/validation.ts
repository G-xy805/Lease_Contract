import { Request, Response, NextFunction } from 'express';

/**
 * 输入验证中间件
 * 用于验证请求参数，防止SQL注入和其他安全漏洞
 */
export const validationMiddleware = {
  /**
   * 验证手机号格式
   */
  validatePhone: (req: Request, res: Response, next: NextFunction) => {
    const { phone } = req.body;
    if (phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          code: 400,
          message: '手机号格式不正确'
        });
      }
    }
    next();
  },

  /**
   * 验证身份证号格式
   */
  validateIdCard: (req: Request, res: Response, next: NextFunction) => {
    const { idcard } = req.body;
    if (idcard) {
      const idcardPattern = /^\d{17}[\dXx]$/;
      if (!idcardPattern.test(idcard)) {
        return res.status(400).json({
          code: 400,
          message: '身份证号格式不正确'
        });
      }
    }
    next();
  },

  /**
   * 验证姓名格式
   */
  validateName: (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;
    if (name) {
      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 20) {
        return res.status(400).json({
          code: 400,
          message: '姓名长度应在2-20个字符之间'
        });
      }
    }
    next();
  },

  /**
   * 验证验证码格式
   */
  validateCode: (req: Request, res: Response, next: NextFunction) => {
    const { code } = req.body;
    if (code) {
      const codeRegex = /^\d{6}$/;
      if (!codeRegex.test(code)) {
        return res.status(400).json({
          code: 400,
          message: '验证码格式不正确'
        });
      }
    }
    next();
  },

  /**
   * 验证用户ID
   */
  validateUserId: (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (id) {
      const userId = parseInt(id);
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
          code: 400,
          message: '无效的用户ID'
        });
      }
    }
    next();
  },

  /**
   * 验证合同ID
   */
  validateContractId: (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (id) {
      const contractId = parseInt(id);
      if (isNaN(contractId) || contractId <= 0) {
        return res.status(400).json({
          code: 400,
          message: '无效的合同ID'
        });
      }
    }
    next();
  },

  /**
   * 验证请求体不为空
   */
  validateBody: (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请求体不能为空'
      });
    }
    next();
  },

  /**
   * 防止SQL注入
   */
  preventSqlInjection: (req: Request, res: Response, next: NextFunction) => {
    const checkSqlInjection = (obj: any) => {
      if (typeof obj === 'string') {
        // 检测常见的SQL注入攻击模式
        const sqlInjectionPatterns = [
          /['"\s]*(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bALTER\b|\bCREATE\b|\bTRUNCATE\b|\bEXEC\b|\bEXECUTE\b|\bUNION\b|\bAND\b|\bOR\b|\bNOT\b|\bFROM\b|\bWHERE\b|\bGROUP\b|\bORDER\b|\bHAVING\b|\bLIMIT\b|\bOFFSET\b)['"\s]*/i
        ];
        
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(obj)) {
            return false;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (!checkSqlInjection(obj[key])) {
            return false;
          }
        }
      } else if (Array.isArray(obj)) {
        for (const item of obj) {
          if (!checkSqlInjection(item)) {
            return false;
          }
        }
      }
      return true;
    };

    if (!checkSqlInjection(req.body) || !checkSqlInjection(req.params) || !checkSqlInjection(req.query)) {
      return res.status(400).json({
        code: 400,
        message: '请求参数包含非法内容'
      });
    }

    next();
  }
};

/**
 * 组合验证中间件
 */
export const combineValidations = (...validations: ((req: Request, res: Response, next: NextFunction) => void)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const validation of validations) {
      validation(req, res, (err?: any) => {
        if (err) {
          return next(err);
        }
      });
      // 如果已经返回了响应，则停止执行
      if (res.headersSent) {
        return;
      }
    }
    next();
  };
};