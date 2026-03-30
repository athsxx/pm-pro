import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { apiFetch } from '../api/client';
import { getToken } from '../api/storage';

let pushSetupDone = false;

export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  if (!getToken()) return;

  // Android: the plugin calls FirebaseMessaging on register(). Without google-services.json
  // and the Google Services Gradle plugin, Firebase is not initialized → native crash ("app keeps stopping").
  // Re-enable after adding FCM per https://capacitorjs.com/docs/apis/push-notifications
  if (Capacitor.getPlatform() === 'android') return;

  try {
    if (!pushSetupDone) {
      pushSetupDone = true;

      PushNotifications.addListener('registration', async (token) => {
        if (!getToken()) return;
        try {
          await apiFetch('/api/users/device-token', {
            method: 'POST',
            body: JSON.stringify({ token: token.value }),
          });
        } catch (e) {
          console.error('Failed to send token to backend', e);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });
    }

    const permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive !== 'granted') {
      const request = await PushNotifications.requestPermissions();
      if (request.receive !== 'granted') return;
    }

    await PushNotifications.register();
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}
