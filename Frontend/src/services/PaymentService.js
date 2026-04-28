// src/services/PaymentService.js
//模拟支付服务 - In production, this would connect to Stripe/PayPal/etc.

import api from '../api/api';

export const PaymentService = {
  // Process payment
  processPayment: async (paymentDetails) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Random success/failure for demo (90% success rate)
        if (Math.random() > 0.1) {
          const transactionId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
          resolve({
            success: true,
            transactionId: transactionId,
            message: 'Payment processed successfully'
          });

          // After successful payment, confirm with backend and send email
          PaymentService.confirmPayment({
            bookingId: paymentDetails.bookingId,
            transactionId: transactionId,
            amount: paymentDetails.amount
          }).catch(error => {
            console.error('Failed to confirm payment with backend:', error);
          });
        } else {
          reject({
            success: false,
            message: 'Payment failed. Please try again.'
          });
        }
      }, 2000);
    });
  },

  // Confirm payment with backend (sends email)
  confirmPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/confirm', paymentData);
      return response.data;
    } catch (error) {
      console.error('Payment confirmation error:', error);
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: async (userId) => {
    // In production, fetch from database
    return [
      { 
        id: 1, 
        type: 'visa', 
        last4: '4242', 
        expiry: '12/25', 
        cardholderName: 'John Doe', 
        isDefault: true,
        brand: 'Visa'
      },
      { 
        id: 2, 
        type: 'mastercard', 
        last4: '8888', 
        expiry: '08/24', 
        cardholderName: 'John Doe', 
        isDefault: false,
        brand: 'Mastercard'
      },
      { 
        id: 3, 
        type: 'paypal', 
        email: 'john.doe@example.com', 
        isDefault: false,
        brand: 'PayPal'
      }
    ];
  },

  // Add payment method
  addPaymentMethod: async (methodData) => {
    // In production, save to database
    return {
      success: true,
      id: Math.floor(Math.random() * 1000),
      ...methodData
    };
  },

  // Delete payment method
  deletePaymentMethod: async (methodId) => {
    // In production, remove from database
    return { success: true };
  },

  // Set default payment method
  setDefaultMethod: async (methodId) => {
    // In production, update database
    return { success: true };
  },

  // Get payment history
  getPaymentHistory: async (userId) => {
    return [
      {
        id: 1,
        date: '2024-03-15',
        amount: 150.00,
        status: 'completed',
        bookingId: 'BK-1234',
        service: 'House Cleaning',
        provider: 'Sarah Johnson'
      },
      {
        id: 2,
        date: '2024-03-10',
        amount: 120.00,
        status: 'completed',
        bookingId: 'BK-1235',
        service: 'Plumbing Repair',
        provider: 'Mike Smith'
      },
      {
        id: 3,
        date: '2024-03-05',
        amount: 180.00,
        status: 'pending',
        bookingId: 'BK-1236',
        service: 'Electrical Work',
        provider: 'John Davis'
      }
    ];
  }
};