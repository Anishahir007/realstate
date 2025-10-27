import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listBrokers, getMyBrokerProfile, getBrokerById, createBroker, updateBroker } from '../controllers/brokerController.js';
import { upload } from '../middleware/multer.js';

const router = Router();

// Super Admin: list and create brokers (descriptive paths)
router.get('/listbroker', requireAuth, requireRole('super_admin'), listBrokers);
router.post('/createbroker', requireAuth, requireRole('super_admin'), upload.single('photo', 'profiles'), createBroker);

// Broker: my profile
router.get('/mybroker', requireAuth, requireRole('broker'), getMyBrokerProfile);

// Super Admin: broker by id (descriptive paths)
router.get('/getbroker/:id', requireAuth, requireRole('super_admin'), getBrokerById);
router.put('/updatebroker/:id', requireAuth, requireRole('super_admin'), upload.single('photo', 'profiles'), updateBroker);

// Removed property routes (moved to /api/properties)

export default router;


