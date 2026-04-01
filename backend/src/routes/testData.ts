import { Router } from 'express';
import { testDataController } from '../controllers/testDataController';

const router = Router();

router.get('/users', testDataController.getTestUsers);
router.get('/contracts', testDataController.getTestContracts);
router.get('/contracts/:id', testDataController.getTestContractById);
router.get('/reset', testDataController.resetTestData);

export default router;
