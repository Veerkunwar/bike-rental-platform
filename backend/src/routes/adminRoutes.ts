import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

import { getDashboardStats, getChartsData } from '../controllers/admin/adminDashboardController';
import {
  listUsers,
  getUserById,
  suspendUser,
  activateUser,
  deleteUser,
} from '../controllers/admin/adminUserController';
import { listAdmins, createAdmin, removeAdmin } from '../controllers/admin/adminAccountController';
import {
  listPendingDocuments,
  approveDocument,
  rejectDocument,
} from '../controllers/admin/adminDocumentController';
import {
  createBike,
  updateBike,
  deleteBike,
  setBikeStatus,
  listAllBikesAdmin,
} from '../controllers/admin/adminBikeController';
import {
  listAllBookingsAdmin,
  updateBookingStatus,
  confirmCashPayment,
} from '../controllers/admin/adminBookingController';
import { listAllPaymentsAdmin, processRefund } from '../controllers/admin/adminPaymentController';
import {
  createCity,
  updateCity,
  deleteCity,
  listAllCitiesAdmin,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/admin/adminCityController';
import {
  listCouponsAdmin,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/admin/adminCouponController';
import {
  listAllTicketsAdmin,
  assignTicket,
  updateTicketStatus,
} from '../controllers/admin/adminSupportController';

const router = Router();

// Every admin route requires a valid JWT AND role === 'admin' (checked
// server-side against the DB record, never against a client-supplied flag).
router.use(protect, authorize('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/charts', getChartsData);

router.get('/users', listUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/activate', activateUser);
router.delete('/users/:id', deleteUser);

// Admin-account management (create/list/remove OTHER admins). Every route in
// this file already requires an authenticated admin, so this is never
// reachable by a regular user or an unauthenticated request.
router.get('/admins', listAdmins);
router.post('/admins', createAdmin);
router.delete('/admins/:id', removeAdmin);

router.get('/documents/pending', listPendingDocuments);
router.patch('/documents/:userId/:docType/approve', approveDocument);
router.patch('/documents/:userId/:docType/reject', rejectDocument);

router.get('/bikes', listAllBikesAdmin);
router.post('/bikes', uploadImage.array('photos', 8), createBike);
router.patch('/bikes/:id', uploadImage.array('photos', 8), updateBike);
router.delete('/bikes/:id', deleteBike);
router.patch('/bikes/:id/status', setBikeStatus);

router.get('/bookings', listAllBookingsAdmin);
router.patch('/bookings/:id/status', updateBookingStatus);
router.patch('/bookings/:id/cash-payment', confirmCashPayment);

router.get('/payments', listAllPaymentsAdmin);
router.post('/refunds', processRefund);

router.get('/cities', listAllCitiesAdmin);
router.post('/cities', createCity);
router.patch('/cities/:id', updateCity);
router.delete('/cities/:id', deleteCity);
router.post('/locations', createLocation);
router.patch('/locations/:id', updateLocation);
router.delete('/locations/:id', deleteLocation);

router.get('/coupons', listCouponsAdmin);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/support', listAllTicketsAdmin);
router.patch('/support/:id/assign', assignTicket);
router.patch('/support/:id/status', updateTicketStatus);

export default router;
