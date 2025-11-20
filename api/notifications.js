// Push Notifications API
const { sql } = require('../lib/db');
const { authenticateRequest } = require('../lib/auth');
const webpush = require('web-push');

// VAPID keys sollten als Umgebungsvariablen gesetzt werden
// Generierung: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6O4KIMGt_2H8xLWOvgfBZIQ'
};

webpush.setVapidDetails(
  'mailto:admin@lanparty2026.local',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

module.exports = async (req, res) => {
  const { method } = req;
  const { action } = req.query;

  try {
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // GET VAPID PUBLIC KEY
    if (method === 'GET' && action === 'public-key') {
      return res.status(200).json({
        success: true,
        publicKey: vapidKeys.publicKey
      });
    }

    // SUBSCRIBE TO PUSH NOTIFICATIONS
    if (method === 'POST' && action === 'subscribe') {
      const { subscription } = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Ungültige Subscription' });
      }

      // Save subscription to database
      await sql`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
        VALUES (
          ${auth.userId},
          ${subscription.endpoint},
          ${subscription.keys.p256dh},
          ${subscription.keys.auth},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id, endpoint)
        DO UPDATE SET
          p256dh = ${subscription.keys.p256dh},
          auth = ${subscription.keys.auth},
          created_at = CURRENT_TIMESTAMP
      `;

      return res.status(200).json({
        success: true,
        message: 'Benachrichtigungen aktiviert'
      });
    }

    // UNSUBSCRIBE FROM PUSH NOTIFICATIONS
    if (method === 'POST' && action === 'unsubscribe') {
      const { endpoint } = req.body;

      await sql`
        DELETE FROM push_subscriptions
        WHERE user_id = ${auth.userId}
        ${endpoint ? sql`AND endpoint = ${endpoint}` : sql``}
      `;

      return res.status(200).json({
        success: true,
        message: 'Benachrichtigungen deaktiviert'
      });
    }

    // GET NOTIFICATION PREFERENCES
    if (method === 'GET' && action === 'preferences') {
      const result = await sql`
        SELECT notify_chat, notify_games, notify_accommodations
        FROM users
        WHERE id = ${auth.userId}
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      return res.status(200).json({
        success: true,
        preferences: {
          chat: result.rows[0].notify_chat !== false,
          games: result.rows[0].notify_games !== false,
          accommodations: result.rows[0].notify_accommodations !== false
        }
      });
    }

    // UPDATE NOTIFICATION PREFERENCES
    if (method === 'PUT' && action === 'preferences') {
      const { chat, games, accommodations } = req.body;

      const updates = [];
      if (chat !== undefined) updates.push(sql`notify_chat = ${chat}`);
      if (games !== undefined) updates.push(sql`notify_games = ${games}`);
      if (accommodations !== undefined) updates.push(sql`notify_accommodations = ${accommodations}`);

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Keine Einstellungen angegeben' });
      }

      await sql`
        UPDATE users
        SET ${sql.join(updates, sql`, `)}
        WHERE id = ${auth.userId}
      `;

      return res.status(200).json({
        success: true,
        message: 'Benachrichtigungs-Einstellungen aktualisiert'
      });
    }

    // SEND NOTIFICATION (Internal use by other APIs)
    if (method === 'POST' && action === 'send') {
      const { type, title, body, data } = req.body;

      if (!type || !title || !body) {
        return res.status(400).json({ error: 'Fehlende Parameter' });
      }

      // Get all subscriptions for users who want this notification type
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
          return res.status(400).json({ error: 'Ungültiger Benachrichtigungs-Typ' });
      }

      const subscriptions = await sql`
        SELECT ps.endpoint, ps.p256dh, ps.auth
        FROM push_subscriptions ps
        JOIN users u ON ps.user_id = u.id
        WHERE u.${sql(notifyColumn)} = true
      `;

      const payload = JSON.stringify({
        title,
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data || {}
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

      return res.status(200).json({
        success: true,
        sent: successful,
        failed: failed
      });
    }

    return res.status(400).json({ error: 'Ungültige Anfrage' });

  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ error: 'Serverfehler' });
  }
};
