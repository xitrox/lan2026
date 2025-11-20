// Notification Helper Functions
const { sql } = require('./db');
const webpush = require('web-push');

// VAPID keys sollten als Umgebungsvariablen gesetzt werden
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6O4KIMGt_2H8xLWOvgfBZIQ'
};

webpush.setVapidDetails(
  'mailto:admin@lanparty2026.local',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
 * Send a push notification to all subscribed users
 * @param {string} type - Type of notification: 'chat', 'games', 'accommodations'
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} data - Optional additional data
 * @returns {Promise<{sent: number, failed: number}>}
 */
async function sendNotification(type, title, body, data = {}) {
  try {
    // Get notification column name
    let notifyColumn;
    switch (type) {
      case 'chat':
        notifyColumn = 'notify_chat';
        break;
      case 'games':
        notifyColumn = 'notify_games';
        break;
      case 'accommodations':
        notifyColumn = 'notify_accommodations';
        break;
      default:
        throw new Error(`Invalid notification type: ${type}`);
    }

    // Get all subscriptions for users who want this notification type
    const subscriptions = await sql`
      SELECT ps.endpoint, ps.p256dh, ps.auth
      FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
      WHERE u.${sql(notifyColumn)} = true
    `;

    if (subscriptions.rows.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { type, ...data }
    });

    const results = await Promise.allSettled(
      subscriptions.rows.map(sub => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        return webpush.sendNotification(pushSubscription, payload)
          .catch(async (error) => {
            // Remove invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
              await sql`
                DELETE FROM push_subscriptions
                WHERE endpoint = ${sub.endpoint}
              `;
            }
            throw error;
          });
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Notification sent: ${successful} successful, ${failed} failed`);

    return { sent: successful, failed };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

module.exports = {
  sendNotification
};
