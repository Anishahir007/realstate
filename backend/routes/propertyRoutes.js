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
  getFeaturedProperties,
  getPropertyFilters,
  searchPropertiesPublic,
} from '../controllers/propertyController.js';

const router = Router();

// Removed generic endpoints; using readable aliases below

// Readable alias endpoints (broker and company)
router.get('/listproperty', requireAuth, requireRole('broker', 'company'), listProperties);
router.get('/getproperty/:id', requireAuth, requireRole('broker', 'company'), getPropertyById);
router.get('/featured', getFeaturedProperties); // Public route for featured properties (uses x-tenant-db header)
router.get('/filters', getPropertyFilters); // Public route for filter options (uses x-tenant-db header)
router.get('/search', searchPropertiesPublic); // Public route for property search (uses x-tenant-db header)
router.post('/createproperty', requireAuth, requireRole('broker', 'company'), createProperty);
// One-shot creation of property + features + tags
router.post('/createproperty/full', requireAuth, requireRole('broker', 'company'), createPropertyFull);
router.put('/updateproperty/:id', requireAuth, requireRole('broker', 'company'), updateProperty);
router.delete('/deleteproperty/:id', requireAuth, requireRole('broker', 'company'), deleteProperty);
// Removed per-section create/update endpoints in favor of /createproperty/full
router.post('/uploadmedia/:id', requireAuth, requireRole('broker', 'company'), upload.single('file', 'properties'), addPropertyMedia);
router.post('/uploadvideo/:id', requireAuth, requireRole('broker', 'company'), addPropertyVideo);
router.delete('/deletemedia/:mediaId', requireAuth, requireRole('broker', 'company'), deletePropertyMedia);
router.post('/setprimary/:id/:mediaId', requireAuth, requireRole('broker', 'company'), setPrimaryPropertyMedia);

// REST-style media aliases
router.post('/:id/media', requireAuth, requireRole('broker', 'company'), upload.single('file', 'properties'), addPropertyMedia);
router.post('/:id/video', requireAuth, requireRole('broker', 'company'), addPropertyVideo);
router.delete('/media/:mediaId', requireAuth, requireRole('broker', 'company'), deletePropertyMedia);
router.post('/:id/media/:mediaId/primary', requireAuth, requireRole('broker', 'company'), setPrimaryPropertyMedia);

// Super admin cross-tenant
router.get('/admin/all', requireAuth, requireRole('super_admin'), listAllBrokerPropertiesAdmin);
router.get('/admin/:brokerId/:id', requireAuth, requireRole('super_admin'), getBrokerPropertyAdmin);
router.get('/admin/stats', requireAuth, requireRole('super_admin'), getSuperAdminPropertyStats);

// Broker/Company stats
router.get('/broker/stats', requireAuth, requireRole('broker'), getBrokerPropertyStats);
router.get('/company/stats', requireAuth, requireRole('company'), getBrokerPropertyStats);

export default router;


