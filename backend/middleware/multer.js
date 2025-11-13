import multer from 'multer';
import fs from 'fs';
import path from 'path';

const ALLOWED_FOLDERS = new Set(['profiles', 'properties', 'documents', 'banners']);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function buildStorage(targetDir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, targetDir),
    filename: (_req, file, cb) => {
      cb(null, file.originalname);
    }
  });
}

export const upload = {
  single(fieldName, folderPath) {
    const clean = String(folderPath || '').replace(/^[\/]+/, '');
    if (!ALLOWED_FOLDERS.has(clean)) {
      throw new Error(`Invalid upload folder: ${folderPath}`);
    }
    const targetDir = path.join('public', clean);
    ensureDir(targetDir);
    const storage = buildStorage(targetDir);
    const mw = multer({ storage }).single(fieldName);
    return (req, res, next) => {
      mw(req, res, (err) => {
        if (err) return res.status(409).json({ message: err.message });
        return next();
      });
    };
  },
  fields(fieldsConfig) {
    // fieldsConfig: [{ name: 'photo', folderPath: 'profiles' }, { name: 'document_front', folderPath: 'documents' }, ...]
    const storages = {};
    for (const field of fieldsConfig) {
      const clean = String(field.folderPath || '').replace(/^[\/]+/, '');
      if (!ALLOWED_FOLDERS.has(clean)) {
        throw new Error(`Invalid upload folder: ${field.folderPath}`);
      }
      const targetDir = path.join('public', clean);
      ensureDir(targetDir);
      storages[field.name] = buildStorage(targetDir);
    }
    // Use diskStorage for all fields, but route to different folders based on field name
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const field = fieldsConfig.find(f => f.name === file.fieldname);
        if (!field) return cb(new Error(`Unknown field: ${file.fieldname}`));
        const clean = String(field.folderPath || '').replace(/^[\/]+/, '');
        const targetDir = path.join('public', clean);
        ensureDir(targetDir);
        cb(null, targetDir);
      },
      filename: (_req, file, cb) => {
        cb(null, file.originalname);
      }
    });
    const fieldNames = fieldsConfig.map(f => ({ name: f.name, maxCount: 1 }));
    const mw = multer({ storage }).fields(fieldNames);
    return (req, res, next) => {
      mw(req, res, (err) => {
        if (err) return res.status(409).json({ message: err.message });
        return next();
      });
    };
  }
};


