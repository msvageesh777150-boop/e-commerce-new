import * as dotenv from 'dotenv';
import twilio from 'twilio';

// Load environment variables (especially for local emulator testing)
dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'dummy_sid';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'dummy_token';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number

let client: twilio.Twilio | null = null;
try {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} catch (error) {
  console.error('Failed to initialize Twilio client:', error);
}

export const sendWhatsAppMessage = async (toPhone: string, messageBody: string): Promise<boolean> => {
  if (!client) {
    console.error('Twilio client is not initialized. Message not sent.');
    return false;
  }
  
  // Format phone number to E.164 if not already (assuming mostly Indian numbers as per project)
  // Ensure the number starts with 'whatsapp:' prefix for Twilio WhatsApp API
  let formattedPhone = toPhone;
  if (!formattedPhone.startsWith('whatsapp:')) {
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }
    formattedPhone = `whatsapp:${formattedPhone}`;
  }

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedPhone
    });
    
    console.log(`WhatsApp message sent successfully. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error(`Error sending WhatsApp message to ${formattedPhone}:`, error);
    return false;
  }
};
