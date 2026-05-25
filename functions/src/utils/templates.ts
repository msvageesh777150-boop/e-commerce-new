export const messageTemplates = {
  orderConfirmation: (name: string, orderId: string, amount: number) => 
    `Hi ${name}, thank you for your order on ANTIGRAVITY! Your order ID is ${orderId}. Total amount: ₹${amount}. We'll notify you once it ships.`,
    
  paymentSuccess: (name: string, orderId: string) => 
    `Hi ${name}, we have successfully received your payment for order ${orderId}. Thank you for shopping with ANTIGRAVITY!`,
    
  orderShipped: (name: string, orderId: string, trackingLink: string) => 
    `Hi ${name}, great news! Your order ${orderId} has been shipped. Track your delivery here: ${trackingLink}`,
    
  deliveryUpdate: (name: string, orderId: string, status: string) => 
    `Hi ${name}, here's an update on your order ${orderId}: Your package is currently marked as '${status}'.`,
    
  cartReminder: (name: string, itemStr: string) => 
    `Hi ${name}, you left some items in your cart (${itemStr}). Complete your checkout now and grab them before they're gone!`
};
