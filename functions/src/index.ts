import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all Cloud Functions from their respective modules
export * from './triggers/orderTriggers';
