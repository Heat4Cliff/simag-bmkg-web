import webpush from 'web-push';
import { prisma } from './db';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:test@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured, skipping push notification');
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  });

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    url: url || '/',
    icon: '/unugha-logo.png'
  });

  const pushPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        payload
      );
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription has expired or is no longer valid
        console.log('Subscription expired. Deleting from DB:', sub.endpoint);
        await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
      } else {
        console.error('Error sending push notification:', err);
      }
    }
  });

  await Promise.allSettled(pushPromises);
}
