import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../lib/errors.js';

const allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + allowed[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) =>
    allowed[file.mimetype] ? cb(null, true) : cb(new AppError(400, 'Apenas JPG, PNG ou WEBP')),
});

const router = Router();

router.post('/', authenticate, upload.array('photos', 5), (req, res) => {
  res.status(201).json({ urls: req.files.map((f) => `${env.PUBLIC_URL}/uploads/${path.basename(f.path)}`) });
});

export default router;
