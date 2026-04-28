import express from 'express';
import { body, query, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  getAvailableSlots,
  getUserBookings,
  getUpcomingBookings,
  getBookingStats,
  cancelBooking,
  rescheduleBooking,
  getProviderBookings,
  completeBooking,
  rateBooking
} from '../controllers/bookingController.js';

const router = express.Router();

const bookingValidation = [
  body('service_id').isInt().withMessage('Valid service ID is required'),
  body('booking_date').isISO8601().withMessage('Valid booking date is required'),
  body('notes').optional().isString()
];

const statusValidation = [
  body('status').isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

const rescheduleValidation = [
  body('new_date').isISO8601().withMessage('Valid new date is required')
];

router.use(protect);

router.post('/', bookingValidation, validate, createBooking);
router.get('/', getBookings);
router.get('/stats', getBookingStats);
router.get('/upcoming', getUpcomingBookings);
router.get('/available-slots', getAvailableSlots);
router.get('/my-bookings', getUserBookings);

router.get('/provider/:providerId',
  authorize('provider', 'admin'),
  getProviderBookings
);

router.get('/:id', getBookingById);
router.put('/:id/status',
  authorize('provider', 'admin'),
  statusValidation,
  validate,
  updateBookingStatus
);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/reschedule',
  rescheduleValidation,
  validate,
  rescheduleBooking
);
router.put('/:id/complete',
  authorize('provider', 'admin'),
  completeBooking
);
router.put('/:id/rate', rateBooking);

export default router;