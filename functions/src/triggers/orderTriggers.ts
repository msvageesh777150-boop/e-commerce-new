import * as functions from 'firebase-functions/v1';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { messageTemplates } from '../utils/templates';

// Trigger when a new order is created in Firestore
export const onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    const orderId = context.params.orderId;
    
    // Safety check
    if (!orderData || !orderData.customerPhone) {
      console.warn(`Order ${orderId} created but missing customer phone number.`);
      return;
    }

    const { customerName, customerPhone, totalAmount } = orderData;
    
    // Generate message using template
    const message = messageTemplates.orderConfirmation(
      customerName || 'Customer', 
      orderId, 
      totalAmount || 0
    );

    // Send WhatsApp notification
    await sendWhatsAppMessage(customerPhone, message);
  });

// Trigger when an existing order is updated in Firestore
export const onOrderUpdated = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    const orderId = context.params.orderId;

    if (!newData || !newData.customerPhone) {
      return;
    }

    const { customerName, customerPhone, status, paymentStatus, trackingLink } = newData;
    
    // Check if Payment Status changed to Success
    if (paymentStatus === 'paid' && previousData.paymentStatus !== 'paid') {
      const msg = messageTemplates.paymentSuccess(customerName || 'Customer', orderId);
      await sendWhatsAppMessage(customerPhone, msg);
    }
    
    // Check if Order Status changed
    if (status !== previousData.status) {
      if (status === 'shipped') {
        const msg = messageTemplates.orderShipped(
          customerName || 'Customer', 
          orderId, 
          trackingLink || 'No link provided'
        );
        await sendWhatsAppMessage(customerPhone, msg);
      } else {
        // Any other status change like 'processing', 'out_for_delivery', 'delivered'
        const msg = messageTemplates.deliveryUpdate(
          customerName || 'Customer', 
          orderId, 
          status
        );
        await sendWhatsAppMessage(customerPhone, msg);
      }
    }
  });

// Optionally: Cart Reminder via Pub/Sub or Scheduled Functions (Cron)
// But for now, we can trigger it via an explicit write to a 'cart_reminders' collection
export const onCartReminderTriggered = functions.firestore
  .document('cart_reminders/{reminderId}')
  .onCreate(async (snap, context) => {
    const reminderData = snap.data();
    if (!reminderData || !reminderData.customerPhone) return;

    const { customerName, customerPhone, itemsSummary } = reminderData;
    const msg = messageTemplates.cartReminder(customerName || 'Customer', itemsSummary || 'items');
    
    await sendWhatsAppMessage(customerPhone, msg);
  });
