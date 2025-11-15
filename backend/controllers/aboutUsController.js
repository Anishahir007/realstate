import { loadSitesMap, saveSitesMap } from '../utils/sites.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAboutUsDir() {
  const root = path.resolve(__dirname, '..');
  const aboutUsDir = path.join(root, 'public', 'about-us');
  if (!fs.existsSync(aboutUsDir)) {
    fs.mkdirSync(aboutUsDir, { recursive: true });
  }
  return aboutUsDir;
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

// Get About Us content
export async function getAboutUs(req, res) {
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
      const userId = req.user.id;
      const userRole = req.user.role;
      if (userRole === 'company' && (site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    const aboutUs = site.aboutUs || null;
    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    
    if (aboutUs) {
      // Construct full URLs for images
      const aboutUsWithUrls = {
        ...aboutUs,
        images: (aboutUs.images || []).map(img => ({
          ...img,
          image_url: img.image_url?.startsWith('http')
            ? img.image_url
            : `${baseUrl}${img.image_url?.startsWith('/') ? img.image_url : `/${img.image_url}`}`
        }))
      };
      return res.json({ data: aboutUsWithUrls });
    }

    return res.json({ data: null });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Update About Us content (text)
export async function updateAboutUs(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    const { title, description, subtitle, mission, vision, values } = req.body;

    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!site.aboutUs) {
      site.aboutUs = {
        title: null,
        subtitle: null,
        description: null,
        mission: null,
        vision: null,
        values: null,
        images: []
      };
    }

    if (title !== undefined) site.aboutUs.title = title || null;
    if (subtitle !== undefined) site.aboutUs.subtitle = subtitle || null;
    if (description !== undefined) site.aboutUs.description = description || null;
    if (mission !== undefined) site.aboutUs.mission = mission || null;
    if (vision !== undefined) site.aboutUs.vision = vision || null;
    if (values !== undefined) site.aboutUs.values = values || null;

    site.updatedAt = new Date().toISOString();
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    const aboutUsWithUrls = {
      ...site.aboutUs,
      images: (site.aboutUs.images || []).map(img => ({
        ...img,
        image_url: img.image_url?.startsWith('http')
          ? img.image_url
          : `${baseUrl}${img.image_url?.startsWith('/') ? img.image_url : `/${img.image_url}`}`
      }))
    };

    return res.json({ data: aboutUsWithUrls });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Upload About Us image
export async function uploadAboutUsImage(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!site.aboutUs) {
      site.aboutUs = {
        title: null,
        subtitle: null,
        description: null,
        mission: null,
        vision: null,
        values: null,
        images: []
      };
    }

    const aboutUsDir = getAboutUsDir();
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(aboutUsDir, fileName);
    
    // Move file from temp to about-us directory
    fs.renameSync(req.file.path, filePath);
    
    const relativePath = `/about-us/${fileName}`;
    const imageId = uuidv4();
    const newImage = {
      id: imageId,
      image_url: relativePath,
      caption: req.body.caption || null,
      position: site.aboutUs.images.length + 1,
      uploadedAt: new Date().toISOString()
    };

    site.aboutUs.images.push(newImage);
    site.updatedAt = new Date().toISOString();
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    return res.json({
      data: {
        ...newImage,
        image_url: `${baseUrl}${relativePath}`
      }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Update image position
export async function updateAboutUsImagePosition(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    const { imageId } = req.params;
    const { position } = req.body;

    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }
    if (!imageId) {
      return res.status(400).json({ message: 'imageId is required' });
    }
    if (position === undefined || position === null) {
      return res.status(400).json({ message: 'position is required' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site || !site.aboutUs || !site.aboutUs.images) {
      return res.status(404).json({ message: 'Site or image not found' });
    }

    // Authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const image = site.aboutUs.images.find(img => img.id === imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const oldPosition = image.position;
    const newPosition = parseInt(position, 10);

    // Update positions
    if (newPosition > oldPosition) {
      site.aboutUs.images.forEach(img => {
        if (img.position > oldPosition && img.position <= newPosition) {
          img.position -= 1;
        }
      });
    } else if (newPosition < oldPosition) {
      site.aboutUs.images.forEach(img => {
        if (img.position >= newPosition && img.position < oldPosition) {
          img.position += 1;
        }
      });
    }

    image.position = newPosition;
    site.updatedAt = new Date().toISOString();
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    return res.json({
      data: {
        ...image,
        image_url: image.image_url?.startsWith('http')
          ? image.image_url
          : `${baseUrl}${image.image_url?.startsWith('/') ? image.image_url : `/${image.image_url}`}`
      }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Update image caption
export async function updateAboutUsImageCaption(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    const { imageId } = req.params;
    const { caption } = req.body;

    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }
    if (!imageId) {
      return res.status(400).json({ message: 'imageId is required' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site || !site.aboutUs || !site.aboutUs.images) {
      return res.status(404).json({ message: 'Site or image not found' });
    }

    // Authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const image = site.aboutUs.images.find(img => img.id === imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    image.caption = caption || null;
    site.updatedAt = new Date().toISOString();
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    return res.json({
      data: {
        ...image,
        image_url: image.image_url?.startsWith('http')
          ? image.image_url
          : `${baseUrl}${image.image_url?.startsWith('/') ? image.image_url : `/${image.image_url}`}`
      }
    });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Delete About Us image
export async function deleteAboutUsImage(req, res) {
  try {
    const slug = req.params.slug || getUserSiteSlug(req);
    const { imageId } = req.params;

    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }
    if (!imageId) {
      return res.status(400).json({ message: 'imageId is required' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site || !site.aboutUs || !site.aboutUs.images) {
      return res.status(404).json({ message: 'Site or image not found' });
    }

    // Authorization
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'company' && (site.ownerType !== 'company' || String(site.companyId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'broker' && (site.ownerType === 'company' || String(site.brokerId) !== String(userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const imageIndex = site.aboutUs.images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = site.aboutUs.images[imageIndex];
    
    // Delete file
    if (image.image_url) {
      const filePath = image.image_url.startsWith('/') ? image.image_url.slice(1) : image.image_url;
      const fullPath = path.join(__dirname, '..', 'public', filePath);
      try {
        if (fs.existsSync(fullPath) && filePath.includes('/about-us/')) {
          fs.unlinkSync(fullPath);
        }
      } catch (fileErr) {
        console.error('Error deleting image file:', fileErr);
      }
    }

    // Remove from array and reorder positions
    site.aboutUs.images.splice(imageIndex, 1);
    site.aboutUs.images.forEach((img, idx) => {
      img.position = idx + 1;
    });

    site.updatedAt = new Date().toISOString();
    sitesMap[slug] = site;
    saveSitesMap(sitesMap);

    return res.json({ message: 'Image deleted' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

// Public endpoint for About Us (for website display)
export async function getPublicAboutUs(req, res) {
  try {
    const slug = req.params.slug;
    if (!slug) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const sitesMap = loadSitesMap();
    const site = sitesMap[slug];
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const aboutUs = site.aboutUs || null;
    const baseUrl = process.env.API_BASE_URL || req.protocol + '://' + req.get('host');
    
    if (aboutUs) {
      const aboutUsWithUrls = {
        ...aboutUs,
        images: (aboutUs.images || []).map(img => ({
          ...img,
          image_url: img.image_url?.startsWith('http')
            ? img.image_url
            : `${baseUrl}${img.image_url?.startsWith('/') ? img.image_url : `/${img.image_url}`}`
        }))
      };
      return res.json({ data: aboutUsWithUrls });
    }

    return res.json({ data: null });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: 'Server error', error: isProd ? undefined : String(err?.message || err) });
  }
}

