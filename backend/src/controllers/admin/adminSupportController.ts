import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { SupportTicket } from '../../models/SupportTicket';

export const listAllTicketsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const tickets = await SupportTicket.find(filter)
    .populate('user', 'fullName email phone')
    .sort({ createdAt: -1 });

  return sendSuccess(res, tickets, 'Tickets fetched.');
});

export const assignTicket = asyncHandler(async (req: Request, res: Response) => {
  const { adminId } = req.body;
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { assignedTo: adminId }, { new: true });
  if (!ticket) throw ApiError.notFound('Ticket not found.');
  return sendSuccess(res, ticket, 'Ticket assigned.');
});

export const updateTicketStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const valid = ['open', 'in_progress', 'resolved', 'closed'];
  if (!valid.includes(status)) throw ApiError.badRequest('Invalid ticket status.');

  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!ticket) throw ApiError.notFound('Ticket not found.');
  return sendSuccess(res, ticket, 'Ticket status updated.');
});
