/**
 * 合同模板路由
 */

import { Router, Request, Response } from 'express';
import { getTemplateList, getTemplateById, getFieldMappings } from '../controllers/templatesController';

const router = Router();

/**
 * GET /api/templates
 * 获取合同模板列表
 */
router.get('/', getTemplateList);

/**
 * GET /api/templates/fields/mapping
 * 获取模板字段映射配置
 */
router.get('/fields/mapping', getFieldMappings);

/**
 * GET /api/templates/:id
 * 获取合同模板详情
 */
router.get('/:id', getTemplateById);

export default router;
