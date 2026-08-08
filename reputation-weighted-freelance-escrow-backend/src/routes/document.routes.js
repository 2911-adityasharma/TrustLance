import { Router } from 'express';
import {
  generateDocument,
  createDocument,
  getDocuments,
  getDocumentByVersion,
  submitDocument,
  approveDocument,
  rejectDocument,
} from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkProjectAccess } from '../middleware/projectAccess.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  generateDocumentSchema,
  createDocumentSchema,
  approveDocumentSchema,
  rejectDocumentSchema,
} from '../validators/document.validator.js';

const router = Router({ mergeParams: true });

// Parent route ka projectId use karke pehle token aur project access dono check hote hain.
router.use(authenticate, checkProjectAccess);

// Frontend input validate karke project document ka AI-generated draft banata hai.
router.post('/generate', validate(generateDocumentSchema), generateDocument);

// Document data validate karke project ke andar naya document version create karta hai.
router.post('/', validate(createDocumentSchema), createDocument);

// Current project ke saare document versions frontend ko return karta hai.
router.get('/', getDocuments);

// URL mein diye version number ka specific document return karta hai.
router.get('/:version', getDocumentByVersion);

// Draft document version ko approval ke liye submit karta hai.
router.post('/:version/submit', submitDocument);

// Approval data validate karke selected document version approve karta hai.
router.post('/:version/approve', validate(approveDocumentSchema), approveDocument);

// Rejection reason validate karke selected document version reject karta hai.
router.post('/:version/reject', validate(rejectDocumentSchema), rejectDocument);

export default router;
