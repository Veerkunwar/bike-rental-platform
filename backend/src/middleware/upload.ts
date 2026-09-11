import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

function buildUploader(allowedTypes: string[], maxSize: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`));
        return;
      }
      cb(null, true);
    },
  });
}

// Documents: government ID / driving license / selfie (jpg, jpeg, png, pdf, <=5MB)
export const uploadDocument = buildUploader(ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE);

// Bike photos / profile photos (jpg, jpeg, png, webp, <=8MB)
export const uploadImage = buildUploader(ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
