import { Router } from 'express';
import { protect } from '../middleware/auth';
import { createTicket, listMyTickets, replyToTicket } from '../controllers/supportController';

const router = Router();
router.use(protect);
router.post('/', createTicket);
router.get('/', listMyTickets);
router.post('/:id/reply', replyToTicket);
export default router;
