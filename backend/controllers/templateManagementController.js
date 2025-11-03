import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for banner uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'templates', 'banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const templateName = req.body.templateName || req.params.templateName || 'default';
    const ext = path.extname(file.originalname);
    cb(null, `${templateName}-banner${ext}`);
  },
});

export const uploadBanner = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (increased from 5MB)
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
}).single('banner');

function getFrontendTemplatesRoot() {
  return path.resolve(__dirname, '..', '..', 'frontend', 'src', 'superadmin', 'templates');
}

function listTemplatesFromFrontend() {
  const root = getFrontendTemplatesRoot();
  try {
    if (!fs.existsSync(root)) return [];
    const entries = fs.readdirSync(root, { withFileTypes: true });
    return entries
      .filter((d) => d.isDirectory())
      .filter((d) => {
        const name = d.name.toLowerCase();
        if (name === 'preview') return false;
        const layoutDir = path.join(root, d.name, 'layout');
        try { return fs.existsSync(layoutDir) && fs.statSync(layoutDir).isDirectory(); } catch { return false; }
      })
      .map((d) => ({ name: d.name, label: d.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
  } catch {
    return [];
  }
}

// Get all templates with their status and banners
export async function getAllTemplates(req, res) {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Get templates from filesystem
    const fsTemplates = listTemplatesFromFrontend();
    
    // Get templates from database - use specific columns to avoid errors if some columns don't exist
    let dbTemplates = [];
    try {
      const [results] = await pool.query('SELECT name, status, banner_image, preview_image, description, label FROM templates');
      dbTemplates = results || [];
    } catch (dbErr) {
      // If query fails (e.g., column doesn't exist), try with minimal columns
      try {
        const [results] = await pool.query('SELECT name, status, banner_image FROM templates');
        dbTemplates = results || [];
      } catch {
        // If templates table doesn't exist or query fails, just use empty array
        dbTemplates = [];
      }
    }
    const dbMap = new Map(dbTemplates.map(t => [t.name, t]));

    // Merge: use DB data if exists, otherwise create from FS
    const templates = fsTemplates.map(t => {
      const db = dbMap.get(t.name);
      // Use db.label if exists, otherwise use t.label (from filesystem), otherwise generate from name
      const label = db?.label || t.label || t.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        name: t.name,
        label: label,
        status: db?.status || 'active',
        banner_image: db?.banner_image || null,
        preview_image: db?.preview_image || null,
        description: db?.description || null,
      };
    });

    return res.json({ data: templates });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('getAllTemplates error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: isProd ? undefined : String(err?.message || err),
    });
  }
}

// Update template status (active/inactive)
export async function updateTemplateStatus(req, res) {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { templateName } = req.params;
    const { status } = req.body;

    if (!templateName || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Check if template exists in DB, if not create it
    const [existing] = await pool.query('SELECT id FROM templates WHERE name = ?', [templateName]);
    
    if (existing.length === 0) {
      // Check if label column exists
      let hasLabelColumn = false;
      try {
        const [columns] = await pool.query('DESCRIBE templates');
        hasLabelColumn = columns.some(col => col.Field === 'label');
      } catch {}

      const label = templateName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      
      if (hasLabelColumn) {
        await pool.query(
          'INSERT INTO templates (name, label, status) VALUES (?, ?, ?)',
          [templateName, label, status]
        );
      } else {
        // If label column doesn't exist, just insert name and status
        await pool.query(
          'INSERT INTO templates (name, status) VALUES (?, ?)',
          [templateName, status]
        );
      }
    } else {
      await pool.query('UPDATE templates SET status = ? WHERE name = ?', [status, templateName]);
    }

    return res.json({ message: 'Template status updated successfully' });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('updateTemplateStatus error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: isProd ? undefined : String(err?.message || err),
    });
  }
}

// Update template banner
export async function updateTemplateBanner(req, res) {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { templateName } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select an image file (max 10MB).' });
    }

    const bannerPath = `/templates/banners/${req.file.filename}`;

    // Check if template exists in DB, if not create it
    const [existing] = await pool.query('SELECT id FROM templates WHERE name = ?', [templateName]);
    
    if (existing.length === 0) {
      // Check if label column exists by trying to describe the table
      let hasLabelColumn = false;
      try {
        const [columns] = await pool.query('DESCRIBE templates');
        hasLabelColumn = columns.some(col => col.Field === 'label');
      } catch {}

      const label = templateName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      
      if (hasLabelColumn) {
        await pool.query(
          'INSERT INTO templates (name, label, banner_image) VALUES (?, ?, ?)',
          [templateName, label, bannerPath]
        );
      } else {
        // If label column doesn't exist, just insert name and banner_image
        await pool.query(
          'INSERT INTO templates (name, banner_image) VALUES (?, ?)',
          [templateName, bannerPath]
        );
      }
    } else {
      // Delete old banner if exists
      const [old] = await pool.query('SELECT banner_image FROM templates WHERE name = ?', [templateName]);
      if (old[0]?.banner_image) {
        const oldPath = path.join(__dirname, '..', 'public', old[0].banner_image);
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch {}
      }
      await pool.query('UPDATE templates SET banner_image = ? WHERE name = ?', [bannerPath, templateName]);
    }

    return res.json({ message: 'Banner updated successfully', data: { banner_image: bannerPath } });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line no-console
    console.error('updateTemplateBanner error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: isProd ? undefined : String(err?.message || err),
    });
  }
}

// Preview template (for super admin)
export async function previewTemplateForAdmin(req, res) {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const template = (req.params.template || '').toString();
    const url = `/site/preview/${template}`;
    return res.json({ data: { previewUrl: url } });
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({
      message: 'Server error',
      error: isProd ? undefined : String(err?.message || err),
    });
  }
}

