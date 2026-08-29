import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { processDocumentUpload } from '../controllers/documentController.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// Routes
router.post('/upload', upload.single('file'), processDocumentUpload);
router.post('/process-base64', express.json({ limit: '25mb' }), processDocumentUpload);

export default router;
