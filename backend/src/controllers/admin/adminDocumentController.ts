import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { User } from '../../models/User';
import { notify } from '../../services/notificationService';
import { sendEmail, emailTemplates } from '../../services/emailService';

type DocKey = 'governmentId' | 'drivingLicense' | 'selfie';
const VALID_KEYS: DocKey[] = ['governmentId', 'drivingLicense', 'selfie'];

export const listPendingDocuments = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({
    $or: [
      { 'documents.governmentId.status': 'pending' },
      { 'documents.drivingLicense.status': 'pending' },
      { 'documents.selfie.status': 'pending' },
    ],
  }).select('fullName email phone documents');

  return sendSuccess(res, users, 'Pending documents fetched.');
});

export const approveDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { userId, docType } = req.params as { userId: string; docType: DocKey };
  if (!VALID_KEYS.includes(docType)) throw ApiError.badRequest('Invalid document type.');

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');

  user.documents[docType].status = 'approved';
  user.documents[docType].reviewedAt = new Date();
  user.documents[docType].reviewedBy = req.user.id as any;
  user.documents[docType].rejectionReason = undefined;
  await user.save();

  await notify(user.id, 'document_approved', 'Document approved', `Your ${docType} has been approved.`);

  return sendSuccess(res, user.documents, 'Document approved.');
});

export const rejectDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { userId, docType } = req.params as { userId: string; docType: DocKey };
  const { reason } = req.body;
  if (!VALID_KEYS.includes(docType)) throw ApiError.badRequest('Invalid document type.');
  if (!reason) throw ApiError.badRequest('A rejection reason is required.');

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');

  user.documents[docType].status = 'rejected';
  user.documents[docType].rejectionReason = reason;
  user.documents[docType].reviewedAt = new Date();
  user.documents[docType].reviewedBy = req.user.id as any;
  await user.save();

  await notify(user.id, 'document_rejected', 'Document rejected', `Your ${docType} was rejected: ${reason}`);
  await sendEmail(user.email, 'Document Rejected', emailTemplates.documentRejected(docType, reason));

  return sendSuccess(res, user.documents, 'Document rejected.');
});
