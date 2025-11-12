import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listCompanies, getMyCompanyProfile, getCompanyById, createCompany, updateCompany, getCompanyMonthlyTrends, listCompaniesWithStats, getCompanyDashboardStats } from '../controllers/companyController.js';
import { listCompanyTeamMembers, createCompanyTeamMember, updateCompanyTeamMember } from '../controllers/companyTeamMemberController.js';
import { upload } from '../middleware/multer.js';

const router = Router();

// Super Admin: list and create companies
router.get('/listcompany', requireAuth, requireRole('super_admin'), listCompanies);
router.post('/createcompany', requireAuth, requireRole('super_admin'), upload.fields([
  { name: 'photo', folderPath: 'profiles' },
  { name: 'document_front', folderPath: 'documents' },
  { name: 'document_back', folderPath: 'documents' }
]), createCompany);
router.get('/monthly-trends', requireAuth, requireRole('super_admin'), getCompanyMonthlyTrends);
router.get('/listcompany-with-stats', requireAuth, requireRole('super_admin'), listCompaniesWithStats);

// Company: my profile
router.get('/mycompany', requireAuth, requireRole('company'), getMyCompanyProfile);

// Company: dashboard stats
router.get('/dashboard-stats', requireAuth, requireRole('company'), getCompanyDashboardStats);

// Company: team members (role-based users)
router.get('/team-members', requireAuth, requireRole('company'), listCompanyTeamMembers);
router.post('/team-members', requireAuth, requireRole('company'), upload.single('photo', 'profiles'), createCompanyTeamMember);
router.put('/team-members/:id', requireAuth, requireRole('company'), upload.single('photo', 'profiles'), updateCompanyTeamMember);

// Super Admin: company by id
router.get('/getcompany/:id', requireAuth, requireRole('super_admin'), getCompanyById);
router.put('/updatecompany/:id', requireAuth, requireRole('super_admin'), upload.fields([
  { name: 'photo', folderPath: 'profiles' },
  { name: 'document_front', folderPath: 'documents' },
  { name: 'document_back', folderPath: 'documents' }
]), updateCompany);

export default router;

