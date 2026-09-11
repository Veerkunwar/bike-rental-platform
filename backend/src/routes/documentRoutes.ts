import { Router } from 'express';
import { protect } from '../middleware/auth';
import { uploadDocument } from '../middleware/upload';
import { uploadMyDocument, getMyDocuments, getDocumentFile } from '../controllers/documentController';

const router = Router();

router.use(protect);
router.get('/', getMyDocuments);
router.post('/:docType', uploadDocument.single('file'), uploadMyDocument);
// Owner-or-admin-only file access (see getDocumentFile for the authorization check).
router.get('/file/:userId/:docType', getDocumentFile);

export default router;
