import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { getUploadDirectory, isMimeAllowed } from '../services/storage.service.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDirectory());
  },
  filename: (req, file, cb) => {
    // Sanitize filename and prevent collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const sanitizedBasename = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);

    cb(null, `${sanitizedBasename}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!isMimeAllowed(file.mimetype)) {
    return cb(new ApiError(400, `File type '${file.mimetype}' is not permitted`));
  }
  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize, // default 10MB
  },
  fileFilter,
});
