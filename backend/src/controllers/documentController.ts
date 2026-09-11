import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { User } from '../models/User';
import { saveFile, getFileStream } from '../config/storage';
import { notify } from '../services/notificationService';

type DocKey = 'governmentId' | 'drivingLicense' | 'selfie';
const VALID_KEYS: DocKey[] = ['governmentId', 'drivingLicense', 'selfie'];

/**
 * A user can only ever read/write their OWN documents object (scoped via
 * req.user.id from the verified JWT) — there is no route that accepts an
 * arbitrary user id here, which is what prevents cross-user document access.
 */
export const uploadMyDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const docType = req.params.docType as DocKey;
  if (!VALID_KEYS.includes(docType)) throw ApiError.badRequest('Invalid document type.');
  if (!req.file) throw ApiError.badRequest('No file uploaded.');

  const stored = await saveFile(req.file.buffer, req.file.originalname, 'documents');

  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('User not found.');

  user.documents[docType] = {
    status: 'pending',
    fileUrl: stored.url,
    fileKey: stored.key,
    uploadedAt: new Date(),
  };
  await user.save();

  await notify(
    user.id,
    'document_uploaded',
    'Document submitted',
    `Your ${docType} was submitted and is pending verification.`,
  );

  return sendSuccess(res, user.documents, 'Document uploaded and pending verification.');
});

export const getMyDocuments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.id).select('documents');
  if (!user) throw ApiError.notFound('User not found.');
  return sendSuccess(res, user.documents, 'Documents fetched.');
});

/**
 * Serves a single document file only to its owner or an admin. This is the
 * ONLY way document files are ever returned — there is no public/static
 * route for the `documents` folder, precisely so one user can never fetch
 * another user's government ID / license / selfie by guessing a URL.
 *
 * Works identically regardless of STORAGE_DRIVER (local/s3/cloudinary):
 * getFileStream() either streams the bytes through this server, or (for
 * Cloudinary) redirects to a short-lived signed URL that Cloudinary itself
 * rejects without a valid signature.
 */
export const getDocumentFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { userId, docType } = req.params as { userId: string; docType: DocKey };

  if (req.user.id !== userId && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have access to this document.');
  }
  if (!VALID_KEYS.includes(docType)) throw ApiError.badRequest('Invalid document type.');

  const user = await User.findById(userId).select('documents');
  if (!user) throw ApiError.notFound('User not found.');

  const fileKey = user.documents[docType]?.fileKey;
  if (!fileKey) throw ApiError.notFound('No file uploaded for this document type.');

  const file = await getFileStream(fileKey);

  if (file.type === 'redirect') {
    return res.redirect(file.url);
  }

  if (file.contentType) res.setHeader('Content-Type', file.contentType);
  file.stream.on('error', () => {
    if (!res.headersSent) res.status(404).json({ success: false, message: 'File not found.' });
  });
  return file.stream.pipe(res);
});
