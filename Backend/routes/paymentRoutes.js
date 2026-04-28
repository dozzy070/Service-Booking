import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { confirmPayment } from '../controllers/paymentController.js';

const router = express.Router();

const paymentValidation = [
  body('bookingId').isInt().withMessage('Valid booking ID is required'),
  body('transactionId').isString().withMessage('Transaction ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required')
];

router.use(protect);

router.post('/confirm', paymentValidation, validate, confirmPayment);

export default router;