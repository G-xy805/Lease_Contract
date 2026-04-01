import { Request, Response } from 'express';
import { testDataService } from '../services/testDataService';

export const testDataController = {
  async getTestUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await testDataService.getTestUsers();
      res.json({
        code: 200,
        message: '获取测试用户成功',
        data: {
          total: users.length,
          list: users
        }
      });
    } catch (error) {
      console.error('获取测试用户错误:', error);
      res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async getTestContracts(req: Request, res: Response): Promise<void> {
    try {
      const contracts = await testDataService.getTestContracts();
      res.json({
        code: 200,
        message: '获取测试合同成功',
        data: {
          total: contracts.length,
          list: contracts
        }
      });
    } catch (error) {
      console.error('获取测试合同错误:', error);
      res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async getTestContractById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ code: 400, message: '无效的合同ID' });
        return;
      }

      const contract = await testDataService.getTestContractById(id);
      if (!contract) {
        res.status(404).json({ code: 404, message: '测试合同不存在' });
        return;
      }

      res.json({
        code: 200,
        message: '获取测试合同详情成功',
        data: {
          contract
        }
      });
    } catch (error) {
      console.error('获取测试合同详情错误:', error);
      res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async resetTestData(req: Request, res: Response): Promise<void> {
    try {
      const result = await testDataService.resetTestData();
      res.json({
        code: 200,
        message: '测试数据重置成功',
        data: {
          usersCount: result.users.length,
          contractsCount: result.contracts.length,
          users: result.users,
          contracts: result.contracts
        }
      });
    } catch (error) {
      console.error('重置测试数据错误:', error);
      res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  }
};
