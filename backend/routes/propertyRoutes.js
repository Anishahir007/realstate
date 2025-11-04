import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';
import {
  listProperties,
  getPropertyById,
  createProperty,
  createPropertyFull,
  updateProperty,
  deleteProperty,
  upsertPropertyFeatures,
  setPropertyHighlights,
  setPropertyAmenities,
  setPropertyLandmarks,
  addPropertyMedia,
  addPropertyVideo,
  deletePropertyMedia,
  setPrimaryPropertyMedia,
  listAllBrokerPropertiesAdmin,
  getBrokerPropertyAdmin,
  getSuperAdminPropertyStats,
  getBrokerPropertyStats,
} from '../controllers/propertyController.js';

const router = Router();

// Removed generic endpoints; using readable aliases below

// Readable alias endpoints
router.get('/listproperty', requireAuth, requireRole('broker'), listProperties);
router.get('/getproperty/:id', requireAuth, requireRole('broker'), getPropertyById);
router.post('/createproperty', requireAuth, requireRole('broker'), createProperty);
// One-shot creation of property + features + tags
router.post('/createproperty/full', requireAuth, requireRole('broker'), createPropertyFull);
router.put('/updateproperty/:id', requireAuth, requireRole('broker'), updateProperty);
router.delete('/deleteproperty/:id', requireAuth, requireRole('broker'), deleteProperty);
// Removed per-section create/update endpoints in favor of /createproperty/full
router.post('/uploadmedia/:id', requireAuth, requireRole('broker'), upload.single('file', 'properties'), addPropertyMedia);
router.post('/uploadvideo/:id', requireAuth, requireRole('broker'), addPropertyVideo);
router.delete('/deletemedia/:mediaId', requireAuth, requireRole('broker'), deletePropertyMedia);
router.post('/setprimary/:id/:mediaId', requireAuth, requireRole('broker'), setPrimaryPropertyMedia);

// REST-style media aliases
router.post('/:id/media', requireAuth, requireRole('broker'), upload.single('file', 'properties'), addPropertyMedia);
router.post('/:id/video', requireAuth, requireRole('broker'), addPropertyVideo);
router.delete('/media/:mediaId', requireAuth, requireRole('broker'), deletePropertyMedia);
router.post('/:id/media/:mediaId/primary', requireAuth, requireRole('broker'), setPrimaryPropertyMedia);

// Super admin cross-tenant
router.get('/admin/all', requireAuth, requireRole('super_admin'), listAllBrokerPropertiesAdmin);
router.get('/admin/:brokerId/:id', requireAuth, requireRole('super_admin'), getBrokerPropertyAdmin);
router.get('/admin/stats', requireAuth, requireRole('super_admin'), getSuperAdminPropertyStats);

// Broker stats
router.get('/broker/stats', requireAuth, requireRole('broker'), getBrokerPropertyStats);

export default router;


