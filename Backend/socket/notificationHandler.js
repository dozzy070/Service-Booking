import { createNotification } from '../controllers/notificationController.js';

export const setupNotificationHandlers = (io, socket) => {
  socket.on('send-notification', async (data) => {
    try {
      const { userId, type, message, notificationData } = data;
      
      const notification = await createNotification(
        userId,
        type,
        message,
        notificationData
      );
      
      io.to(`user:${userId}`).emit('notification', notification);
    } catch (error) {
      console.error('Error sending notification:', error);
      socket.emit('notification-error', { message: 'Failed to send notification' });
    }
  });

  socket.on('send-bulk-notification', async (data) => {
    try {
      const { userIds, type, message, notificationData } = data;
      
      userIds.forEach(async (userId) => {
        const notification = await createNotification(
          userId,
          type,
          message,
          notificationData
        );
        
        io.to(`user:${userId}`).emit('notification', notification);
      });
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      socket.emit('notification-error', { message: 'Failed to send notifications' });
    }
  });

  socket.on('mark-notification-read', async (data) => {
    try {
      const { notificationId } = data;
      socket.emit('notification-read-ack', { notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });
};