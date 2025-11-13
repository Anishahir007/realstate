import pool from '../config/database.js';
import { loadSitesMap, saveSitesMap } from '../utils/sites.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBannersDir() {
  const root = path.resolve(__dirname, '..');
  const bannersDir = path.join(root, 'public', 'banners');
  if (!fs.existsSync(bannersDir)) {
    fs.mkdirSync(bannersDir, { recursive: true });
  }
  return bannersDir;
}

// Get current user's site slug
function getUserSiteSlug(req) {
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  if (!userId) return null;
  
  const sitesMap = loadSitesMap();
  for (const [slug, site] of Object.entries(sitesMap)) {
    if (userRole === 'company' && site.ownerType === 'company' && String(site.companyId) === String(userId)) {
      return slug;
    } else if (userRole === 'broker' && (!site.ownerType || site.ownerType === 'broker') && String(site.brokerId) === String(userId)) {
      return slug;
    }
  }
  return null;
}

// Get hero banners for a site
export async function getHeroBanners(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (!site.ownerType || site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const banners = site.heroBanners || [];
    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    
    const bannersWithUrl = banners.map(banner => ({
      ...banner,
      image_url: banner.image_url?.startsWith('http') ? banner.image_url : `${baseUrl}${banner.image_url?.startsWith('/') ? banner.image_url : `/${banner.image_url}`}`
    }));

    return res.json({ data: bannersWithUrl });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Upload hero banner
export async function uploadHeroBanner(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (!site.ownerType || site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const file = req.file;
    if (!file || !file.filename) {
      return res.status(400).json({ message: 'File is required' });
    }

    const { position, width, height } = req.body || {};
    const positionNum = position ? parseInt(position, 10) : (site.heroBanners?.length || 0) + 1;
    const widthValue = width !== undefined && width !== null && width !== '' ? String(width) : null;
    const heightValue = height !== undefined && height !== null && height !== '' ? parseInt(height, 10) : null;

    const fileUrl = `/banners/${file.filename}`;
    const bannersDir = getBannersDir();
    const filePath = path.join(bannersDir, file.filename);

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ message: 'File upload failed' });
    }

    const newBanner = {
      id: Date.now().toString(),
      image_url: fileUrl,
      position: positionNum,
      width: widthValue,
      height: heightValue,
      created_at: new Date().toISOString()
    };

    if (!site.heroBanners) {
      site.heroBanners = [];
    }
    site.heroBanners.push(newBanner);
    
    // Sort by position
    site.heroBanners.sort((a, b) => (a.position || 0) - (b.position || 0));
    site.updatedAt = new Date().toISOString();
    
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    return res.status(201).json({
      data: {
        ...newBanner,
        image_url: `${baseUrl}${fileUrl}`
      }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Update hero banner dimensions
export async function updateHeroBannerDimensions(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    const { bannerId } = req.params;
    const { width, height } = req.body;

    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (!bannerId) {
      return res.status(400).json({ message: 'bannerId is required' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site || !site.heroBanners) {
      return res.status(404).json({ message: 'Site or banner not found' });
    }

    // Check authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (!site.ownerType || site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const banner = site.heroBanners.find(b => b.id === bannerId);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const widthValue = width !== undefined && width !== null && width !== '' ? String(width) : null;
    const heightValue = height !== undefined && height !== null && height !== '' ? parseInt(height, 10) : null;

    banner.width = widthValue;
    banner.height = heightValue;
    site.updatedAt = new Date().toISOString();
    
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    return res.json({ 
      data: {
        ...banner,
        image_url: banner.image_url?.startsWith('http') ? banner.image_url : `${baseUrl}${banner.image_url?.startsWith('/') ? banner.image_url : `/${banner.image_url}`}`
      }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Update hero banner position
export async function updateHeroBannerPosition(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    const { bannerId } = req.params;
    const { position } = req.body;

    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (!bannerId || position === undefined) {
      return res.status(400).json({ message: 'bannerId and position are required' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site || !site.heroBanners) {
      return res.status(404).json({ message: 'Site or banner not found' });
    }

    // Check authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (!site.ownerType || site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const banner = site.heroBanners.find(b => b.id === bannerId);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    banner.position = parseInt(position, 10);
    site.heroBanners.sort((a, b) => (a.position || 0) - (b.position || 0));
    site.updatedAt = new Date().toISOString();
    
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    return res.json({ message: 'Position updated', data: banner });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Delete hero banner
export async function deleteHeroBanner(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    const { bannerId } = req.params;

    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (!bannerId) {
      return res.status(400).json({ message: 'bannerId is required' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site || !site.heroBanners) {
      return res.status(404).json({ message: 'Site or banner not found' });
    }

    // Check authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (!site.ownerType || site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const bannerIndex = site.heroBanners.findIndex(b => b.id === bannerId);
    if (bannerIndex === -1) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const banner = site.heroBanners[bannerIndex];
    
    // Delete file from filesystem
    if (banner.image_url) {
      const filePath = banner.image_url.startsWith('/') ? banner.image_url.slice(1) : banner.image_url;
      const fullPath = path.join(__dirname, '..', 'public', filePath);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (fileErr) {
        console.error('Error deleting banner file:', fileErr);
      }
    }

    site.heroBanners.splice(bannerIndex, 1);
    site.updatedAt = new Date().toISOString();
    
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    return res.json({ message: 'Banner deleted' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Public endpoint to get hero banners for a site (for website display)
export async function getPublicHeroBanners(req, res) {
  try {
    const slug = req.params.slug;
    if (!slug) {
      return res.status(400).json({ message: 'Slug is required' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const banners = (site.heroBanners || []).sort((a, b) => (a.position || 0) - (b.position || 0));
    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    
    const bannersWithUrl = banners.map(banner => ({
      ...banner,
      image_url: banner.image_url?.startsWith('http') ? banner.image_url : `${baseUrl}${banner.image_url?.startsWith('/') ? banner.image_url : `/${banner.image_url}`}`
    }));

    return res.json({ data: bannersWithUrl });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Get site logo
export async function getSiteLogo(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check authorization for authenticated requests
    if (req.user) {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      if (userRole === 'company' && (!site.ownerType || site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    const logo = site.logo || null;
    const logoData = logo ? {
      image_url: logo.image_url?.startsWith('http') ? logo.image_url : `${baseUrl}${logo.image_url?.startsWith('/') ? logo.image_url : `/${logo.image_url}`}`,
      width: logo.width || null,
      height: logo.height || null
    } : null;

    return res.json({ data: logoData });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Upload/Update site logo
export async function uploadSiteLogo(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (!site.ownerType || site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const file = req.file;
    if (!file || !file.filename) {
      return res.status(400).json({ message: 'File is required' });
    }

    const { width, height } = req.body || {};
    const widthNum = width ? parseInt(width, 10) : null;
    const heightNum = height ? parseInt(height, 10) : null;

    const fileUrl = `/banners/${file.filename}`;
    const bannersDir = getBannersDir();
    const filePath = path.join(bannersDir, file.filename);

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ message: 'File upload failed' });
    }

    // Delete old logo file if exists
    if (site.logo && site.logo.image_url) {
      const oldFilePath = site.logo.image_url.startsWith('/') ? site.logo.image_url.slice(1) : site.logo.image_url;
      const oldFullPath = path.join(__dirname, '..', 'public', oldFilePath);
      try {
        if (fs.existsSync(oldFullPath) && oldFilePath.includes('/banners/')) {
          fs.unlinkSync(oldFullPath);
        }
      } catch (fileErr) {
        console.error('Error deleting old logo file:', fileErr);
      }
    }

    const logoData = {
      image_url: fileUrl,
      width: widthNum,
      height: heightNum,
      updated_at: new Date().toISOString()
    };

    site.logo = logoData;
    site.updatedAt = new Date().toISOString();
    
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    return res.json({
      data: {
        ...logoData,
        image_url: `${baseUrl}${fileUrl}`
      }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Update logo dimensions only (without re-uploading)
export async function updateLogoDimensions(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site || !site.logo) {
      return res.status(404).json({ message: 'Site or logo not found' });
    }

    // Check authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (!site.ownerType || site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { width, height } = req.body || {};
    const widthNum = width !== undefined && width !== null && width !== '' ? parseInt(width, 10) : null;
    const heightNum = height !== undefined && height !== null && height !== '' ? parseInt(height, 10) : null;

    // Update logo dimensions
    site.logo.width = widthNum;
    site.logo.height = heightNum;
    site.logo.updated_at = new Date().toISOString();
    site.updatedAt = new Date().toISOString();
    
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    return res.json({
      data: {
        ...site.logo,
        image_url: site.logo.image_url?.startsWith('http') 
          ? site.logo.image_url 
          : `${baseUrl}${site.logo.image_url?.startsWith('/') ? site.logo.image_url : `/${site.logo.image_url}`}`,
        width: widthNum,
        height: heightNum
      }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Delete site logo
export async function deleteSiteLogo(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (!site.ownerType || site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Delete logo file
    if (site.logo && site.logo.image_url) {
      const filePath = site.logo.image_url.startsWith('/') ? site.logo.image_url.slice(1) : site.logo.image_url;
      const fullPath = path.join(__dirname, '..', 'public', filePath);
      try {
        if (fs.existsSync(fullPath) && filePath.includes('/banners/')) {
          fs.unlinkSync(fullPath);
        }
      } catch (fileErr) {
        console.error('Error deleting logo file:', fileErr);
      }
    }

    site.logo = null;
    site.updatedAt = new Date().toISOString();
    
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    return res.json({ message: 'Logo deleted' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

