// src/services/PaymentService.js
export const PaymentService = {
  // Process payment
  processPayment: async (paymentDetails) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 90% success rate for demo
        if (Math.random() > 0.1) {
          resolve({
            success: true,
            transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            message: 'Payment processed successfully'
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

  // Get payment methods
  getPaymentMethods: async (userId) => {
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
      }
    ];
  }
};