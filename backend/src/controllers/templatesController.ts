/**
 * 合同模板控制器
 */

import { Request, Response } from 'express';
import { query } from '../database';
import { ContractTemplateRow, ContractTemplateListQuery, ContractTemplateListResult } from '../models/ContractTemplate';
import { templateFieldMappings, fieldGroups } from '../config/contractTemplate';

// 通用响应格式
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 获取合同模板列表
 * GET /api/templates
 */
export const getTemplateList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, keyword, page = 1, pageSize = 10 } = req.query as ContractTemplateListQuery;

    const pageNum = Math.max(1, parseInt(page as unknown as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as unknown as string) || 10));
    const offset = (pageNum - 1) * pageSizeNum;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status !== undefined && status !== null) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (keyword) {
      whereClause += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM contract_templates ${whereClause}`;
    const countResult = await query<(ContractTemplateRow & { total: number })[]>(countSql, params);
    const total = countResult[0]?.total || 0;

    // 查询列表
    const listSql = `
      SELECT id, name, code, description, category, status, version,
             created_at, updated_at
      FROM contract_templates
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `;
    const listParams = [...params, pageSizeNum, offset];
    const list = await query<ContractTemplateRow[]>(listSql, listParams);

    const result: ContractTemplateListResult = {
      list: list as any,
      total,
      page: pageNum,
      pageSize: pageSizeNum
    };

    const response: ApiResponse<ContractTemplateListResult> = {
      code: 200,
      message: '获取成功',
      data: result
    };

    res.json(response);
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取合同模板详情
 * GET /api/templates/:id
 */
export const getTemplateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        code: 400,
        message: '模板ID不能为空'
      });
      return;
    }

    const sql = `
      SELECT id, name, code, description, html_content, field_mapping,
             category, status, version, created_at, updated_at, created_by
      FROM contract_templates
      WHERE id = ?
    `;

    const results = await query<ContractTemplateRow[]>(sql, [id]);

    if (results.length === 0) {
      res.status(404).json({
        code: 404,
        message: '模板不存在'
      });
      return;
    }

    const template = results[0];

    // 如果有字段映射配置，合并默认配置
    if (template.field_mapping) {
      try {
        const storedMapping = typeof template.field_mapping === 'string' 
          ? JSON.parse(template.field_mapping) 
          : template.field_mapping;
        template.field_mapping = { ...templateFieldMappings, ...storedMapping };
      } catch (e) {
        template.field_mapping = templateFieldMappings;
      }
    } else {
      template.field_mapping = templateFieldMappings;
    }

    const response: ApiResponse<ContractTemplateRow> = {
      code: 200,
      message: '获取成功',
      data: template
    };

    res.json(response);
  } catch (error) {
    console.error('获取模板详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取模板字段映射配置
 * GET /api/templates/fields/mapping
 */
export const getFieldMappings = async (req: Request, res: Response): Promise<void> => {
  try {
    const response: ApiResponse = {
      code: 200,
      message: '获取成功',
      data: {
        fields: templateFieldMappings,
        groups: fieldGroups
      }
    };
    res.json(response);
  } catch (error) {
    console.error('获取字段映射失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

export default {
  getTemplateList,
  getTemplateById,
  getFieldMappings
};
