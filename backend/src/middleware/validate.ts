import { Request, Response, NextFunction } from 'express';

interface ValidationRule {
  field: string;
  type?: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export function validate(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field] ?? req.query[rule.field] ?? req.params[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rule.type === 'number' && isNaN(Number(value))) {
          errors.push(`${rule.field} must be a number`);
        }
        if (rule.minLength && String(value).length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && String(value).length > rule.maxLength) {
          errors.push(`${rule.field} must not exceed ${rule.maxLength} characters`);
        }
        if (rule.pattern && !rule.pattern.test(String(value))) {
          errors.push(`${rule.field} format is invalid`);
        }
        if (rule.custom) {
          const customError = rule.custom(value);
          if (customError) errors.push(customError);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ code: 400, message: errors.join('; '), data: null });
    }

    next();
  };
}
