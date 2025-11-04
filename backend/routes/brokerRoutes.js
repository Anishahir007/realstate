import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listBrokers, getMyBrokerProfile, getBrokerById, createBroker, updateBroker, getBrokerMonthlyTrends, listBrokersWithStats, getBrokerDashboardStats } from '../controllers/brokerController.js';
import { upload } from '../middleware/multer.js';

const router = Router();

// Super Admin: list and create brokers (descriptive paths)
router.get('/listbroker', requireAuth, requireRole('super_admin'), listBrokers);
router.post('/createbroker', requireAuth, requireRole('super_admin'), upload.fields([
  { name: 'photo', folderPath: 'profiles' },
  { name: 'document_front', folderPath: 'documents' },
  { name: 'document_back', folderPath: 'documents' }
]), createBroker);
router.get('/monthly-trends', requireAuth, requireRole('super_admin'), getBrokerMonthlyTrends);
router.get('/listbroker-with-stats', requireAuth, requireRole('super_admin'), listBrokersWithStats);

// Broker: my profile
router.get('/mybroker', requireAuth, requireRole('broker'), getMyBrokerProfile);

// Broker: dashboard stats
router.get('/dashboard-stats', requireAuth, requireRole('broker'), getBrokerDashboardStats);

// Super Admin: broker by id (descriptive paths)
router.get('/getbroker/:id', requireAuth, requireRole('super_admin'), getBrokerById);
router.put('/updatebroker/:id', requireAuth, requireRole('super_admin'), upload.fields([
  { name: 'photo', folderPath: 'profiles' },
  { name: 'document_front', folderPath: 'documents' },
  { name: 'document_back', folderPath: 'documents' }
]), updateBroker);

// Removed property routes (moved to /api/properties)

export default router;


