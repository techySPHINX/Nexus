import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from 'firebase/messaging';

/**
 * Firebase Configuration for Push Notifications
 *
 * Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Cloud Messaging in Project Settings
 * 3. Generate a Web Push certificate in Project Settings > Cloud Messaging
 * 4. Copy your Firebase config and add to .env:
 *    - VITE_FIREBASE_API_KEY
 *    - VITE_FIREBASE_AUTH_DOMAIN
 *    - VITE_FIREBASE_PROJECT_ID
 *    - VITE_FIREBASE_STORAGE_BUCKET
 *    - VITE_FIREBASE_MESSAGING_SENDER_ID
 *    - VITE_FIREBASE_APP_ID
 *    - VITE_FIREBASE_VAPID_KEY (Web Push certificate public key)
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase
 */
export const initializeFirebase = (): FirebaseApp | null => {
  try {
    if (!firebaseConfig.apiKey) {
      console.warn(
        '⚠️ Firebase not configured. Push notifications will not work.'
      );
      return null;
    }

    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
    return app;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    return null;
  }
};

/**
 * Get Firebase Messaging instance
 */
export const getFirebaseMessaging = (): Messaging | null => {
  if (!app) {
    app = initializeFirebase();
    if (!app) return null;
  }

  if (!messaging) {
    try {
      messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialized');
    } catch (error) {
      console.error('❌ Error initializing Firebase Messaging:', error);
      return null;
    }
  }

  return messaging;
};

/**
 * Request notification permissions and get FCM token
 */
export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  try {
    // Check if Notifications API is supported
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('❌ Notification permission denied');
      return null;
    }

    console.log('✅ Notification permission granted');

    // Get FCM token
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.warn('⚠️ Firebase Messaging not available');
      return null;
    }

    if (!vapidKey) {
      console.error('❌ VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Register FCM token with backend
 */
export const registerFCMToken = async (
  token: string,
  authToken: string
): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3000/users/fcm/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ deviceToken: token }),
    });

    if (!response.ok) {
      throw new Error('Failed to register FCM token');
    }

    console.log('✅ FCM token registered with backend');
    return true;
  } catch (error) {
    console.error('❌ Error registering FCM token:', error);
    return false;
  }
};

/**
 * Unregister FCM token from backend
 */
export const unregisterFCMToken = async (
  authToken: string
): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3000/users/fcm/unregister', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to unregister FCM token');
    }

    console.log('✅ FCM token unregistered from backend');
    return true;
  } catch (error) {
    console.error('❌ Error unregistering FCM token:', error);
    return false;
  }
};

/**
 * Handle foreground messages
 */
export const onForegroundMessage = (
  callback: (payload: { title: string; body: string; data?: unknown }) => void
): (() => void) => {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    console.warn('⚠️ Firebase Messaging not available for foreground messages');
    return () => {};
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('📨 Foreground message received:', payload);

    const title = payload.notification?.title || 'New Message';
    const body = payload.notification?.body || '';
    const data = payload.data;

    callback({ title, body, data });
  });

  return unsubscribe;
};

/**
 * Initialize FCM for the app
 * Call this once when the app starts
 */
export const initializeFCM = async (authToken: string): Promise<void> => {
  try {
    // Initialize Firebase
    const app = initializeFirebase();
    if (!app) {
      console.warn('⚠️ Firebase not initialized. Skipping FCM setup.');
      return;
    }

    // Request permission and get token
    const fcmToken = await requestNotificationPermission();
    if (!fcmToken) {
      console.warn(
        '⚠️ FCM token not obtained. Push notifications will not work.'
      );
      return;
    }

    // Register token with backend
    await registerFCMToken(fcmToken, authToken);

    // Set up foreground message listener
    onForegroundMessage((payload) => {
      console.log('📨 Foreground notification:', payload);

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: '/favicon.ico',
          tag: 'message-notification',
        });
      }
    });

    console.log('✅ FCM initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing FCM:', error);
  }
};
