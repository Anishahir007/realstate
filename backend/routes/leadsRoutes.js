import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listAdminLeads, createAdminLead, updateAdminLead, listBrokerLeads, createBrokerLead, updateBrokerLead, listCompanyLeads, createCompanyLead, updateCompanyLead, listAllSourcesLeads } from '../controllers/leadsController.js';

const router = Router();

// Admin-scoped leads (main website leads only)
// GET /api/leads/admin -> list admin leads
// POST /api/leads/admin -> create admin lead
router.get('/admin', requireAuth, requireRole('super_admin'), listAdminLeads);
router.post('/admin', requireAuth, requireRole('super_admin'), createAdminLead);
router.patch('/admin/:id', requireAuth, requireRole('super_admin'), updateAdminLead);

// Broker-scoped leads (broker website tenant DB)
// GET /api/leads/broker -> list broker leads
// POST /api/leads/broker -> create broker lead
router.get('/broker', requireAuth, requireRole('broker'), listBrokerLeads);
router.post('/broker', requireAuth, requireRole('broker'), createBrokerLead);
router.patch('/broker/:id', requireAuth, requireRole('broker'), updateBrokerLead);

// Company-scoped leads (company website tenant DB)
// GET /api/leads/company -> list company leads
// POST /api/leads/company -> create company lead
router.get('/company', requireAuth, requireRole('company'), listCompanyLeads);
router.post('/company', requireAuth, requireRole('company'), createCompanyLead);
router.patch('/company/:id', requireAuth, requireRole('company'), updateCompanyLead);

// Super admin combined view (admin + all brokers + all companies)
// GET /api/leads/admin/all-sources
router.get('/admin/all-sources', requireAuth, requireRole('super_admin'), listAllSourcesLeads);

export default router;


