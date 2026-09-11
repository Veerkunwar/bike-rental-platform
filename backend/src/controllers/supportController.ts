import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { SupportTicket } from '../models/SupportTicket';

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { category, subject, message, relatedBooking } = req.body;
  if (!category || !subject || !message) throw ApiError.badRequest('category, subject and message are required.');

  const ticket = await SupportTicket.create({
    user: req.user.id,
    category,
    subject,
    relatedBooking,
    messages: [{ sender: req.user.id, senderRole: 'user', message }],
  });

  return sendSuccess(res, ticket, 'Support ticket created.', 201);
});

export const listMyTickets = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const tickets = await SupportTicket.find({ user: req.user.id }).sort({ createdAt: -1 });
  return sendSuccess(res, tickets, 'Tickets fetched.');
});

export const replyToTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { message } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found.');
  if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') throw ApiError.forbidden();

  ticket.messages.push({
    sender: req.user.id as any,
    senderRole: req.user.role,
    message,
    createdAt: new Date(),
  });
  if (req.user.role === 'admin' && ticket.status === 'open') ticket.status = 'in_progress';
  await ticket.save();

  return sendSuccess(res, ticket, 'Reply added.');
});
