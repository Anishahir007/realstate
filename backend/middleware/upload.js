import multer from 'multer';
import fs from 'fs';
import path from 'path';

const ALLOWED_FOLDERS = new Set(['profiles']);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function buildStorage(targetDir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, targetDir),
    filename: (_req, file, cb) => {
      // keep original name; simple approach
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
  }
};


